require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Song = require('./src/models/Song');

const SEARCH_QUERIES = [
  'rock', 'pop', 'hip hop', 'arctic monkeys',
  'kendrick lamar', 'billie eilish', 'the weeknd', 'adele'
];

async function seedSongs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let totalAdded = 0;

    for (const query of SEARCH_QUERIES) {
      console.log(`Searching for: ${query}`);
      
      try {
        const response = await axios.get(
          `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=25`
        );

        const songs = response.data.data;

        for (const song of songs) {
          try {
            const exists = await Song.findOne({ deezerId: song.id.toString() });
            if (exists) continue;

            await Song.create({
              deezerId: song.id.toString(),
              title: song.title,
              artist: song.artist.name,
              album: song.album.title,
              preview: song.preview,
              cover: song.album.cover_medium || song.album.cover_big,
              duration: song.duration,
              rank: song.rank
            });

            totalAdded++;
            console.log(`Added: ${song.title} - ${song.artist.name}`);

          } catch (err) {
            if (err.code !== 11000) { 
              console.error(`Error adding song: ${err.message}`);
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        console.error(`✗ Error searching ${query}: ${err.message}`);
      }
    }

    console.log(`\n🎉 Seeding complete! Added ${totalAdded} songs to database.`);
    
    const total = await Song.countDocuments();
    console.log(`📊 Total songs in database: ${total}`);

  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedSongs();