import config from './config.json' with { type: "json" };
import axios from 'axios'

function send_discord_message(body) {
  // Send a POST request
  if (config.enable_discord) {
    axios({
      method: "post",
      url: config.discordWebHookUrl,
      data: {
        username: "HENodeCheck",
        content: body,
      },
    });
  }
}

export {
    send_discord_message
};
