import { withPluginApi } from 'discourse/lib/plugin-api';
import { postUrl, escapeExpression } from 'discourse/lib/utilities';
import { wantsNewWindow } from 'discourse/lib/intercept-click';
import { setTransientHeader } from 'discourse/lib/ajax';
import DiscourseURL from 'discourse/lib/url';
import { userPath } from 'discourse/lib/url';

const INVITED_TYPE = 8;

export default {
  name: 'a-planning-alerts-edits',
  initialize(){

    function url() {
      const attrs = this.attrs;
      const data = attrs.data;

      const external_url = data.external_url;
      if (external_url) {
        return external_url;
      }

      const badgeId = data.badge_id;
      if (badgeId) {
        let badgeSlug = data.badge_slug;

        if (!badgeSlug) {
          const badgeName = data.badge_name;
          badgeSlug = badgeName.replace(/[^A-Za-z0-9_]+/g, '-').toLowerCase();
        }

        let username = data.username;
        username = username ? "?username=" + username.toLowerCase() : "";
        return Discourse.getURL('/badges/' + badgeId + '/' + badgeSlug + username);
      }

      const topicId = attrs.topic_id;
      if (topicId) {
        return postUrl(attrs.slug, topicId, attrs.post_number);
      }

      if (attrs.notification_type === INVITED_TYPE) {
        return userPath(data.display_username);
      }

      if (data.group_id) {
        return userPath(data.username + '/messages/group/' + data.group_name);
      }
    }

    function description() {
      const data = this.attrs.data;
      const badgeName = data.badge_name;
      if (badgeName) { return escapeExpression(badgeName); }

      const desc = data.description;
      if (desc) { return escapeExpression(desc); }

      const title = data.topic_title;
      return Ember.isEmpty(title) ? "" : escapeExpression(title);
    }

    function click(e) {
      this.attrs.set('read', true);
      const id = this.attrs.id;
      setTransientHeader("Discourse-Clear-Notifications", id);
      if (document && document.cookie) {
        document.cookie = `cn=${id}; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
      }
      if (wantsNewWindow(e)) { return; }
      e.preventDefault();

      this.sendWidgetEvent('linkClicked');

      const externalUrl = this.attrs.data.external_url;
      if (externalUrl) {
        var tab = window.open(externalUrl, '_blank');
        tab.focus();
      } else {
        DiscourseURL.routeTo(this.url());
      }
    }

    withPluginApi('0.1', api => {
      api.reopenWidget('notification-item', {
        url,
        description,
        click
      });
    });
  }
};
