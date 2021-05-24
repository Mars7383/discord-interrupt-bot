const Discord = require("discord.js");
const client = new Discord.Client();

/* Config */
const token = ""; // Bot token here
const ownerID = 0; // Optional, put your own ID here so that you're the only one who can run bot commands
/* Config */

let victim = 0; // This variable will be dynamically updated to the ID of the person you specify with !troll, best to leave this alone

client.on("ready", () => {
    // Fetches every member of all the guilds the bot is in (probably not required)
    client.guilds.cache.forEach((guild) => {
        guild.members.fetch();
    });
    console.log(`The bot is ready! Logged in as ${client.user.username}#${client.user.discriminator}`);
});

function joinChannel(channel) {
    channel.join().then(connection => {
        console.log(`Successfully joined 🔊 ${connection.channel.name}!`);
        let dispatcher = connection.play('audio.mp3');
        dispatcher.pause(); // Prevent autoplay
        // dispatcher.setVolume(2); // You can mess around with the volume if you want, 2 means 2x as loud 😉
        dispatcher.on("finish", end => {
            dispatcher = connection.play('audio.mp3'); // Loop audio
            dispatcher.pause(); // Prevent autoplay
        });
        connection.on('speaking', (member, speaking) => {
            console.log(member.username, + speaking["bitfield"] == 1 ? "is speaking!" : "stopped speaking!"); // Outputs whether or not they're currently speaking
            if (member.id != victim) return; // We only want to talk over the victim, not the entire voice channel
            if (speaking["bitfield"] == 1) {
                dispatcher.resume(); // Play audio when they start talking
            } else {
                dispatcher.pause(); // Pause audio when they stop talking
            }
        });
    });
}

client.on("message", message => {
    if (message.content.startsWith("!troll")) {
        if (ownerID != 0 && parseInt(message.author.id) !== ownerID) return; // If ownerID is specified, ignore everyone else besides the owner
        let args = message.content.split(" ");
        try {message.delete();}catch(e){}; // Delete the message if we have the perms to do so
        if (args[1] == null) {
            // No ID specified
            message.author.send("You need to put the ID of the person you're trying to troll after the command (example: !troll 1234567890)");
            return;
        }
        let victimMember = message.guild.members.cache.get(args[1]); // Get member object from ID
        if (victimMember != null) {
            // Member exists
            victim = args[1]
            message.author.send(`I set the victim to <@${args[1]}>! If they're already in a VC, I'll auto-join. If not, I'll join the VC right after they do!`);
            console.log(`Now trolling: ${victimMember.user.username}#${victimMember.user.discriminator} (ID: ${victim})`);
            if (victimMember.voice.channel != null) {
                joinChannel(victimMember.voice.channel); // Join the victim's VC if they're already in one
            }
        } else {
            // ID is invalid, at least for the message's guild
            message.author.send("I couldn't find that user in your server, double check the ID?");
        }
    }
})

client.on('voiceStateUpdate', (oldMember, newMember) => {
    if (newMember.channel != null) {
        // User joined a voice channel
        if (newMember.id == victim) joinChannel(newMember.channel); // Follow them into the voice channel
    } else {
        // User left the voice channel
        try {
            if (newMember.id == victim) oldMember.channel.leave(); // Leave with them
        } catch(e){}; // If we do get an error, it's probably that the bot doesn't have any VC to leave, nothing important
    }
});

client.login(token);
