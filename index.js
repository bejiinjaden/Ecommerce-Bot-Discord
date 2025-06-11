require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

const WELCOME_CHANNEL_NAME = 'welcome'; // ✅ Ensure this exists in your server
const CATEGORY_NAME = 'Clients Companies'; // ✅ Auto-created if not found

client.on('ready', () => {
  console.log(`✅ Bot is ready as ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  const guild = member.guild;
  const welcomeChannel = guild.channels.cache.find(
    ch => ch.name === WELCOME_CHANNEL_NAME && ch.type === ChannelType.GuildText
  );

  if (!welcomeChannel) return;

  welcomeChannel.send(`👋 Welcome, ${member}! Please enter your **Company Name** to get started.`);

  const filter = m => m.author.id === member.id;
  const collector = welcomeChannel.createMessageCollector({ filter, max: 1, time: 60000 });

  collector.on('collect', async (msg) => {
    const companyName = msg.content.trim();

    // Find or create the category
    let category = guild.channels.cache.find(
      ch => ch.name === CATEGORY_NAME && ch.type === ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: CATEGORY_NAME,
        type: ChannelType.GuildCategory,
      });
    }

    // Create private channel
    const privateChannel = await guild.channels.create({
      name: companyName.toLowerCase().replace(/\s+/g, '-'),
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: member.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        },
        {
          id: client.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        },
      ],
    });

    privateChannel.send(`🚀 Welcome, ${member}! This is your private channel for **${companyName}**. Let's build something great!`);
    welcomeChannel.send(`✅ Your private channel "**${companyName}**" has been created in **${CATEGORY_NAME}**.`);
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      welcomeChannel.send(`${member}, you didn't respond in time. Please type your company name to create your private channel.`);
    }
  });
});

// ✅ Login
client.login(process.env.DISCORD_TOKEN);
// trigger redeploy
