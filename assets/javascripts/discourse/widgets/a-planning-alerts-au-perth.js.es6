import { createApp } from 'discourse/plugins/civically-app/discourse/widgets/app';
import { popupAjaxError } from 'discourse/lib/ajax-error';
import { ajax } from 'discourse/lib/ajax';
import { h } from 'virtual-dom';

export default createApp('a-planning-alerts-au-perth', {
  tagName: 'div.a-planning-alerts-au-perth',
  buildKey: () => 'a-planning-alerts-au-perth',

  defaultState() {
    return {
      showInput: false,
      loading: false
    };
  },

  sendShowCreateAccount() {
    const appRoute = this.register.lookup('route:application');
    appRoute.send('showCreateAccount');
  },

  setPostcode() {
    let self = this;
    self.state.loading = true;
    const postcode = $('.a-planning-alerts-au-perth input').val();

    ajax("/a-planning-alerts-au-perth/set-postcode", {
      type: 'POST',
      data: { postcode }
    }).then(function (result, error) {
      self.state.loading = false;
      self.state.showInput = false;
      if (error) {
        popupAjaxError(error);
      } else {
        const currentUser = Discourse.User.current();
        currentUser.setProperties({
          postcode: postcode,
          c_user_alerts_au_perth: true
        });
      }
      self.scheduleRerender();
    });
  },

  checkNow() {
    ajax("/a-planning-alerts-au-perth/check", { type: 'POST' }).then(function (result, error) {
      if (error) {
        popupAjaxError(error);
      }
    });
  },

  toggleAlerts(state) {
    let self = this;
    self.state.loading = true;
    ajax("/a-planning-alerts-au-perth/toggle-state", { type: 'POST', data: {
       state: state
     }
    }).then(function (result, error) {
     self.state.loading = false;
     if (error) {
        popupAjaxError(error);
     } else {
       const currentUser = Discourse.User.current();
       currentUser.set('a_planning_alerts_au_perth', state);
     }
     self.scheduleRerender();
    });
  },

  toggleInput() {
    this.state.showInput = true;
  },

  content(attrs, state) {
    const user = this.currentUser;
    let contents = [];

    if (state && state.loading) {
      contents.push(h('div.spinner.small'));
    } else {
      if (user) {
        if (user.a_planning_alerts_au_perth && !state.showInput) {
          contents.push(
            h('div.widget-description'),
              I18n.t('a_planning_alerts_au_perth.enabled', {
                postcode: user.postcode
              }
            ),
            h('div.widget-controls', [
              this.attach('link', {
                label: "disable",
                action: "toggleAlerts",
                actionParam: false
              }),
              this.attach('link', {
                label: "a_planning_alerts_au_perth.change_id",
                action: "toggleInput"}),
              this.attach('link', {
                label: "a_planning_alerts_au_perth.check_now",
                action: "checkNow" })
            ])
          );
        } else {
          if (user.postcode && !state.showInput) {
            contents.push(
              h('div.widget-description',
                I18n.t('a_planning_alerts_au_perth.disabled', {
                  postcode: user.postcode
                }
              )),
              h('div.widget-controls', [
                this.attach('link', {
                  label: "enable",
                  action: "toggleAlerts",
                  actionParam: true
                }),
                this.attach('link', {
                  label: "a_planning_alerts_au_perth.change_id",
                  action: "toggleInput" })
              ])
            );
          } else {
            contents.push(
              h('input', {
                placeholder: I18n.t('a_planning_alerts_au_perth.placeholder')
              }),
              this.attach('button', {
                label: "a_planning_alerts_au_perth.submit",
                className: 'btn btn-primary btn-small',
                action: "setPostcode"
              })
            );
          };
        }
      } else {
        contents.push([
          h('div.widget-guest', I18n.t('app.guest'))
        ]);
      }
    }

    return contents;
  }

});
