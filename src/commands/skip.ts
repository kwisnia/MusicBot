import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { GuildMember } from 'discord.js';
import { ICommand } from '../services/interaction/ICommand';
import { MusicGuild } from '../typings/MusicGuild';

const skip: ICommand = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Pomija aktualnie grający utwór'),
  execute: async (interaction) => {
    const guild = interaction.guild as MusicGuild;
    const member = interaction.member as GuildMember;
    if (!guild) {
      await interaction.reply({
        content: 'Ale ja nie działam na DMach',
        ephemeral: true,
      });
      return Promise.resolve();
    }
    const connection = getVoiceConnection(guild.id);
    if (!connection) {
      await interaction.reply({
        content: 'Ale ja nic nie gram!',
        ephemeral: true,
      });
      return Promise.resolve();
    }
    if (connection.joinConfig.channelId !== member.voice.channelId) {
      await interaction.reply({
        content: 'Nie możesz skipować będąc poza kanałem',
        ephemeral: true,
      });
      return Promise.resolve();
    }
    await interaction.reply(`❌ Pomijam \`${guild.queue[0].title}\``);
    guild.queue.shift();
    if (!guild.queue.length) {
      connection.destroy();
      await interaction.followUp('Nie ma czego plądrować, wychodzę');
    } else {
      const player = await createNewAudioPlayer(guild.queue, connection);
      connection.subscribe(player);
    }
    return Promise.resolve();
  },
};

export default skip;
