# name: a-planning-alerts_au-perth
# app: true
# version: 0.1
# authors: angus
# image_url: https://fortunelords-zpq4xnxcq9v.netdna-ssl.com/wp-content/uploads/2017/02/google-alerts.jpg
# url: https://github.com/civicallyhq/c-planning-alerts-au-perth

register_asset 'stylesheets/a-planning-alerts-au-perth.scss'

require 'open-uri'

after_initialize do
  User.register_custom_field_type('a_planning_alerts_au_perth', :boolean)
  User.register_custom_field_type('postcode', :integer)

  module ::APlanningAlertsAuPerth
    class Engine < ::Rails::Engine
      engine_name "a_user_alerts_au_perth"
      isolate_namespace APlanningAlertsAuPerth
    end
  end

  APlanningAlertsAuPerth::Engine.routes.draw do
    post "set-postcode" => "alerts#set_postcode"
    post "toggle-state" => "alerts#toggle_state"
    post "check" => "alerts#check"
  end

  Discourse::Application.routes.append do
    mount ::APlanningAlertsAuPerth::Engine, at: "a-planning-alerts-au-perth"
  end

  class APlanningAlertsAuPerth::AlertsController < ::ApplicationController
    def set_postcode
      params.require(:postcode)
      postcode = params[:postcode]

      user = current_user
      user.custom_fields["postcode"] = postcode
      user.custom_fields["a_planning_alerts_au_perth"] = true
      user.save_custom_fields(true)

      render json: success_json
    end

    def toggle_state
      params.require(:state)
      state = params[:state]

      user = current_user
      user.custom_fields["a_planning_alerts_au_perth"] = state
      user.save_custom_fields(true)

      render json: success_json
    end

    def check
      enabled = UserCustomField.where(name: "a_planning_alerts_au_perth").pluck(:user_id)
      user_ids = UserCustomField.where(name: "postcode", user_id: enabled).pluck(:user_id)
      user_ids.each do |user_id|
        user = User.find(user_id)
        postcode = user.custom_fields["postcode"]
        url = "https://api.planningalerts.org.au/applications.js?key=rmIcM6zuSdd9MU%2BKxOMf&postcode=#{postcode}"
        alerts = JSON.parse(open(url).read)
        application = alerts[0]['application']
        description = application['address'] + ': ' + application['description']
        user.notifications.create(
          notification_type: Notification.types[:custom],
          data: {
            external_url: application['info_url'],
            description: description,
            message: 'a_planning_alerts_au_perth.notification.message'
          }.to_json
        )
      end
      render json: success_json
    end
  end

  add_to_serializer(:current_user, :postcode) { object.custom_fields["postcode"] }
  add_to_serializer(:current_user, :a_planning_alerts_au_perth) { object.custom_fields["a_planning_alerts_au_perth"] }
end
