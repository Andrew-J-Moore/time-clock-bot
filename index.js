"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const User = require("./models/user");
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const config_1 = tslib_1.__importDefault(require("./config"));
const commands_1 = tslib_1.__importDefault(require("./commands"));
const { intents, prefix, token } = config_1.default;
const client = new discord_js_1.Client({
  intents,
  presence: {
    status: 'online',
    activities: [{
      name: `${prefix}help`,
      type: 'LISTENING'
    }]
  }
});
client.on('ready', () => {
  console.log(`Logged in as: ${client.user?.tag}`);
});

//Mongo DB connection
mongoose.connect(process.env.MONGO_DB_LINK,
  { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected');
  })
  .catch(err => {
    console.log(err);
  });

client.on('messageCreate', async (message) => {
  if (message.author.bot)
    return;
  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift();
    switch (command) {

      //help command 
      case 'help':
        const embed = (0, commands_1.default)(message);
        embed.setThumbnail(client.user.displayAvatarURL());
        await message.channel.send({ embeds: [embed] });
        break;

      //clockin command
      case 'clockin':
        const now = new Date();
        let userData = client.users.cache.find(user1 => user1.id == message.author.id);
        const clockin_embed = new discord_js_1.MessageEmbed()
          .setDescription(`${userData}` + " clocked into " + message.guild.name + "!")
          .setFooter({text: now.toLocaleString('en-US') + ' UTC'});

        User.findOne({ user_id: message.author.id, server_id: message.guild.id }).then(sender => {
          //for if user already exists
          if (sender) {
            //user object with updated properties
            const updatedUser = new User({
              _id: sender._id,
              user_id: sender.user_id,
              server_id: sender.server_id,
              clockin: now,
              clocked_in: true,
              total_time: sender.total_time
            });
            //update user in database
            User.updateOne({ _id: sender._id }, updatedUser).then(() => {
              message.channel.send({ embeds: [clockin_embed] })
            }).catch(err => {
              message.channel.send("An error occurred. Please try again in a few seconds.");
              console.log(err);
            });
          } else { //make new user if does not exist
            message.reply("Looks like you haven't clocked in yet. Creating new user file...");
            //new user object
            const newUser = new User({
              user_id: message.author.id,
              clockin: now,
              clocked_in: true,
              total_time: 0,
              server_id: message.guild.id
            });
            //create new user 
            newUser.save().then(sender => {
              message.channel.send({ embeds: [clockin_embed] });
            }).catch(err => {
              message.channel.send("An error occurred. Please try again in a few seconds.");
              console.log(err);
            });
          }
        });
        break;

      //clockout command. going off duty
      case 'clockout':

        var clockout_now = new Date();

        User.findOne({ user_id: message.author.id, server_id: message.guild.id }).then(sender => {
          if (!sender || !sender.clocked_in) {
            message.reply("Looks like you never clocked into " + message.guild.name + "...");
          } else if (sender && sender.clocked_in) {

            //calculating time in ms
            const elapsed_ms = clockout_now - sender.clockin;

            //calculating elapsed time in mins
            const elapsed_mins = Math.floor(elapsed_ms / 60000);

            // setting up pretty embed
            let userData = client.users.cache.find(user1 => user1.id == message.author.id);
            const clockout_embed = new discord_js_1.MessageEmbed()
              .setDescription(`${userData}` + " clocked out of **" + message.guild.name + "!** Added **" + elapsed_mins + "** mins to your time.")
              .setFooter({text: clockout_now.toLocaleString('en-US') + ' UTC'});

            //updated user object
            const updatedUser = new User({
              _id: sender._id,
              user_id: sender.user_id,
              clockin: 0,
              clocked_in: false,
              total_time: sender.total_time + elapsed_ms,
              server_id: sender.server_id
            });

            //saving user object
            User.updateOne({ _id: sender._id }, updatedUser).then(() => {
              message.channel.send({ embeds: [clockout_embed] });
            })
              .catch(err => {
                console.log(err);
                message.channel.send("Some error occurred. Please try again in a few seconds.");
              });
          }
        })

        break;

      // data command
      case 'data':
        const time_now = new Date();

        if(args[0] == "all" && message.member.permissions.has("MANAGE_GUILD")){
          User.find({server_id: message.guild.id}).sort({elapsed_time:1}).then(users => {

            if(users.length == 0) {
              message.reply("Either no one has clocked in or an error occurred. Please try again later.");
            } else if(users) {
              const ALLDATA_EMBED = new discord_js_1.MessageEmbed()
              .setTitle("All data for **" + message.guild.name + ":**")
              .setFooter({text: time_now.toLocaleString() + " UTC"});

              for (let user of users) {
                
                let time_ms = user.total_time;
                let time_days = Math.floor(time_ms / 86400000);
                let time_hrs = Math.floor((time_ms - (time_days * 86400000)) / 3600000);
                let time_mins = Math.floor((time_ms - (time_days * 8640000) - (time_hrs * 3600000)) / 60000);
                let time_secs = Math.floor((time_ms - (time_days * 8640000) - (time_hrs * 3600000) - (time_mins * 60000)) / 1000);

                let userData = client.users.cache.find(user1 => user1.id == user.user_id);
                
                ALLDATA_EMBED.addField("~~~~~~~~~~~~~~~~~~~~~~~~~~", `${userData} - ` + time_days + " days, " + time_hrs + " hrs, " + time_mins + " mins, " + time_secs + " secs.\n\n", true);
                
              }

              message.author.send({embeds: [ALLDATA_EMBED]});
              message.reply("Check your dms ;)");
              
            }
            
          }).catch(err => {
            console.log(err);
            message.reply("An error ocurred. Please try again later.");
          });
        } else {
          //pulling user data
          User.findOne({ user_id: message.author.id, server_id: message.guild.id }).then(sender => {
            if(!sender) {
              message.reply("Looks like you haven't clocked in since the last time data was cleared.");
            } else {
              let time_ms = sender.total_time;
              let time_days = Math.floor(time_ms / 86400000);
              let time_hrs = Math.floor((time_ms - (time_days * 86400000)) / 3600000);
              let time_mins = Math.floor((time_ms - (time_days * 8640000) - (time_hrs * 3600000)) / 60000);
              let time_secs = Math.floor((time_ms - (time_days * 8640000) - (time_hrs * 3600000) - (time_mins * 60000)) / 1000);
    
              const data_embed = new discord_js_1.MessageEmbed()
                .setTitle(message.author.username + "'s data in " + message.guild.name + ": ")
                .setDescription(time_days + " days, " + time_hrs + " hrs, " + time_mins + " mins, " + time_secs + " secs.")
                .setFooter({ text: time_now.toLocaleString() + " UTC" });
    
              message.channel.send({ embeds: [data_embed] });
            }
  
          }).catch(err => {
            message.channel.send("An error occurred. Please try again in a few seconds.");
            console.log(err);
          });
        }
        break;

      case 'clockedin':

        const time_now1 = new Date();

        User.find({ server_id: message.guild.id, clocked_in: true }).then(clockedin => {

          const clockedin_embed = new discord_js_1.MessageEmbed()
            .setTitle("Everyone clocked into " + message.guild.name + " right now:\n")
            .setFooter({ text: time_now1.toLocaleString() + " UTC" });

          for (let user of clockedin) {
            let elapsed_time = Math.floor((time_now1 - user.clockin) / 60000);
            let userInfo = client.users.cache.find(user1 => user1.id == user.user_id);
            // console.log(userInfo);
            clockedin_embed.addField("~~~~~~~~~~~~~~~~~~~~~~~~~~", `${userInfo}` + " - " + elapsed_time + " mins\n\n", true);
          }
          console.log(clockedin_embed.fields);
          message.channel.send({ embeds: [clockedin_embed] });

        }).catch(err => {
          console.log(err);
          message.channel.send("An error occurred. Please try again in a few seconds.");
        });

        break;

      case 'force':
        const force_now = new Date();
        console.log(message.member.permissions.has("MANAGE_GUILD"));
        // console.log(args);

        if(!message.member.permissions.has("MANAGE_GUILD")){
          message.reply("Sorry. You don't have permission to do that.");
        } else if(args[0] == 'clockin') {
          if(!message.mentions.users.first()) {
            message.reply("That's the wrong format. Please do $force [command] [user]");
          } else {
            let mentioned_user = client.users.cache.find(user1 => user1.id == message.mentions.users.first());
            let userID = message.mentions.users.first().id;

            User.findOne({user_id: userID, server_id: message.guild.id}).then(user => {
              if(user && user.clocked_in) {
                message.reply ("That user is already clockedin.");
              }
              else if(user && !user.clocked_in) {
                const updatedUser = {
                  _id: user._id,
                  user_id: user.user_id,
                  clockin: force_now,
                  clocked_in: true,
                  total_time: user.total_time,
                  server_id: user.server_id
                };
                User.updateOne(updatedUser).then(() => {
                  const FORCECI_EMBED = new discord_js_1.MessageEmbed()
                    .setDescription(`${mentioned_user}` + " succesfully clocked into " + message.guild.name)
                  .setFooter({text: force_now.toLocaleString() + " UTC"});

                  message.channel.send({embeds:[FORCECI_EMBED]});
                }).catch(err => {
                  console.log(err);
                  message.channel.send("An error occurred. Please try again.");
                });
              }
            })
          }
        } else if (args[0] == "clockout") {
          if(!message.mentions.users.first()) {
            message.reply("That's the wrong format. Please do $force [command] [user]");
          } else {
            let mentioned_user = message.mentions.users.first();
            let userID = message.mentions.users.first().id;

            User.findOne({user_id: userID, server_id: message.guild.id}).then(user => {
              if(user && !user.clocked_in) {
                message.reply ("That user is already clocked out.");
              }
              else if(user && user.clocked_in) {
                const elapsed_time = force_now - user.clockin;
                const updatedUser = {
                  _id: user._id,
                  user_id: user.user_id,
                  clockin: user.clockin,
                  clocked_in: false,
                  total_time: user.total_time + elapsed_time,
                  server_id: user.server_id
                };
                User.updateOne(updatedUser).then(() => {
                  const FORCECO_EMBED = new discord_js_1.MessageEmbed()
                    .setDescription(`${mentioned_user}` + " succesfully clocked out of **" + message.guild.name + "**\nAdded **" + Math.floor(elapsed_time/60000) + "** mins to their time.")
                  .setFooter({text: force_now.toLocaleString() + " UTC"});

                  message.channel.send({embeds:[FORCECO_EMBED]});
                }).catch(err => {
                  console.log(err);
                  message.channel.send("An error occurred. Please try again.");
                });
              }
            })
          }
        }

        break;

      case 'clear':

        if(!message.member.permissions.has("MANAGE_GUILD")){
          message.reply("Sorry. You don't have permission to do that.");
        } else {
          const m = await message.reply("Are you sure you want to do this? It can't be undone. React with :thumbsup: to confirm and :thumbsdown: to cancel.");

          m.react('👍').then(r => {
            m.react('👎');
          });

          const filter = (reaction, user) => {
            return reaction.emoji.name && user.id == message.author.id;
          }

          const collector = m.createReactionCollector({filter, time: 30000});

          collector.on('collect', (reaction, user) => {
            if (reaction.emoji.name == '👍') {
              message.reply('Clearing data...');
              User.deleteMany({server_id: message.guild.id}).then(() => {
                message.channel.send("All data for " + message.guild.name + " has been cleared.");
              }).catch(err => {
                console.log(err);
                message.channel.send("An error ocurred. Please try again.");
              });
            }
            else
              message.reply('Operation canceled.');
          })
          
        }

        break;

      case 'add':
        const add_now = new Date();
        if(!message.member.permissions.has("MANGE_GUILD")) {
          message.reply("Sorry, you don't have permission to do this...");
        } else {
          const time_to_add = args[1];
          const mentioned_user = message.mentions.users.first();
          User.findOne({user_id: mentioned_user.id, server_id: message.guild.id}).then(user => {
            if(!user) {
              const new_add_embed = new discord_js_1.MessageEmbed()
              .setDescription(`File created for ${mentioned_user} and added ${time_to_add} mins to their time!`)
              .setFooter({text: `${add_now.toLocaleString()} UTC`});
              message.channel.send("No data file exists yet. I'll create one now...");
              const newUser = new User({
                user_id: mentioned_user.id,
                server_id: message.guild.id,
                clockin: Date.now(),
                clocked_in: false,
                total_time: time_to_add * 60000
              });

              newUser.save().then(user => {
                message.channel.send({embeds: [new_add_embed]});                
              }).catch(err => {
                console.log(err);
                message.channel.send("An error occurred. Please try again later.");
              });
              
            } else {
              const add_embed = new discord_js_1.MessageEmbed()
              .setDescription(`Successfully added ${time_to_add} mins to ${mentioned_user}'s time!`)
              .setFooter({text: `${add_now.toLocaleString()} UTC`})

              const updatedUser = new User({
                _id: user._id,
                user_id: user.user_id,
                clockin: user.clockin,
                clocked_in: user.clocked_in,
                total_time: user.total_time + (time_to_add * 60000),
                server_id: user.server_id
              });

              User.updateOne(updatedUser).then(result => {
                message.channel.send({embeds: [add_embed]});
              }).catch(err => {
                console.log(err);
                message.channel.send("An error ocurred. Please try again later.");
              });
              
            }
          }).catch(err => {
            console.log(err);
            message.channel.send("An error ocurred. Please try again later.");
          })
        }

        break;

    }
  }
});
client.login(token);
//# sourceMappingURL=index.js.map