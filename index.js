const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://jaoqsxmqofdnzjatkgai.supabase.co/rest/v1/";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphb3FzeG1xb2ZkbnpqYXRrZ2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNDgxMTUsImV4cCI6MjA2NjgyNDExNX0.A8_s-DpkmXTNdxz73M_ofbmWV4quumKCk7eA2lMk49E";

const supabaseHeaders = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates"
};

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Helper Functions ---
function removeHtmlTags(str) {
  return str ? str.replace(/<[^>]*>/g, '') : "";
}

function formatEnergyTags(str) {
  return str
    ? str.replace(/<span class="energy-text energy-text--type-(\w+)"><\/span>/g, (_, type) =>
        type.charAt(0).toUpperCase() + type.slice(1)
      )
    : "";
}

function getEvolvesInto(name, pokemonCards) {
  const arr = pokemonCards
    .filter(b => b.pokemon.previousEvolution && b.pokemon.previousEvolution.name === name)
    .map(b => b.name);
  // Remove duplicates and sort for consistency
  return [...new Set(arr)].sort();
}

function formatPack(a) {
  if (a.isPromotion) {
    let packName = a.promotionCardSource.replace(/Obtained from (a|the) /, "");
    return [packName.charAt(0).toUpperCase() + packName.slice(1).toLowerCase()];
  }
  return a.availablePacks.length > 0 ? a.availablePacks.map(b => b.name) : [];
}

// --- Card Builders ---
function buildPokemonCard(a, pokemonCards, rarityObj, gens) {
  const abilityInfo = a.pokemon.pokemonAbilities.length > 0
    ? {
        description: removeHtmlTags(formatEnergyTags(a.pokemon.pokemonAbilities[0].description)),
        name: a.pokemon.pokemonAbilities[0].name
      }
    : { description: "", name: "" };

  const attackInfo = a.pokemon.pokemonAttacks.length > 0
    ? a.pokemon.pokemonAttacks.map(ak => ({
        attackCost: Array.isArray(ak.attackCost) && ak.attackCost.length > 0
          ? ak.attackCost.join(", ")
          : "NA",
        attackDamage: ak.damage,
        attackExtra: removeHtmlTags(formatEnergyTags(ak.description)),
        attackName: ak.name,
        attackSymbol: ak.damageSymbolLabel || ""
      }))
    : "NA";

  const name = a.name;
  const evolvesFrom = a.pokemon.previousEvolution ? a.pokemon.previousEvolution.name : "";
  const evolvesInto = getEvolvesInto(name, pokemonCards);
  const hp = a.pokemon.hp;
  const info = removeHtmlTags(a.flavorText);
  const pack = formatPack(a);
  const set = a.expansion.name;
  const retreatCost = a.pokemon.retreatAmount;
  const rarity = rarityObj[a.rarityName];
  const slNo = `${a.expansionCollectionNumbers[0].expansionId.toUpperCase()}-${a.expansionCollectionNumbers[0].collectionNumber.toString().padStart(3, '0')}`;
  const stage = a.pokemon.evolutionLabel;
  const type = a.pokemon.pokemonTypes[0];
  const weakness = a.pokemon.weaknessType !== 'UNSPECIFIED' ? a.pokemon.weaknessType : "";
  const description = removeHtmlTags(formatEnergyTags(a.description));
  const pokedexId = a.pokedexNumber;
  const generation = gens.findIndex(([start, end]) => pokedexId >= start && pokedexId <= end) + 1;
  const variants = a.variants.length;
  const packPoints = a.dustCost;
  const illustrator = a.illustratorNames.toString();
  const cardId = a.cardId;

  return {
    cardId, abilityInfo, attackInfo, cardType: "Pokemon", evolvesFrom, evolvesInto,
    name, hp, info, pack, set, rarity, retreatCost, slNo, stage, type, weakness,
    description, pokedexId, variants, packPoints, generation, illustrator
  };
}

function buildTrainerCard(a, pokemonCards, rarityObj) {
  const name = a.name;
  const evolvesInto = getEvolvesInto(name, pokemonCards);
  const pack = formatPack(a);
  const set = a.expansion.name;
  const rarity = rarityObj[a.rarityName];
  const slNo = `${a.expansionCollectionNumbers[0].expansionId.toUpperCase()}-${a.expansionCollectionNumbers[0].collectionNumber.toString().padStart(3, '0')}`;
  const stage = a.trainer.trainerType;
  const description = removeHtmlTags(formatEnergyTags(a.description));
  const variants = a.variants.length;
  const packPoints = a.dustCost;
  const illustrator = a.illustratorNames.toString();
  const cardId = a.cardId;

  return {
    cardId, abilityInfo: {}, attackInfo: [], cardType: "Trainer", evolvesFrom: "", evolvesInto,
    name, hp: 0, info: "", pack, set, rarity, retreatCost: 0, slNo, stage, type: "", weakness: "",
    description, pokedexId: -1, variants, packPoints, generation: -1, illustrator
  };
}

// --- Main Data Fetch & Transform ---
async function fetchPokemonData(exp) {
  const response = await axios.get('https://www.pokemon-zone.com/api/game/game-data/');
  const jsonData = response.data;
  const gens = [
    [1, 151], [152, 251], [252, 386], [387, 493], [494, 649],
    [650, 721], [722, 809], [810, 905], [906, 1025]
  ];
  const rarityObj = {
    "Common": 'Diamond',
    "Uncommon": 'Diamond, Diamond',
    "Rare": 'Diamond, Diamond, Diamond',
    "Double Rare": 'Diamond, Diamond, Diamond, Diamond',
    "Art Rare": 'Star',
    "Super Rare": 'Star, Star',
    "Immersive Rare": 'Star, Star, Star',
    "Crown Rare": 'Crown',
    "Special Art Rare": 'Star, Star',
    "Shiny": 'Shiny',
    "Shiny Super Rare": 'Shiny, Shiny'
  };

  let pokemonCards, trainerCards, packsData, setsData;
  if (exp) {
    pokemonCards = jsonData.data.cards.filter(a => a.pokemon && a.expansionCollectionNumbers[0].expansionId == exp);
    trainerCards = jsonData.data.cards.filter(a => a.trainer && a.expansionCollectionNumbers[0].expansionId == exp);
    packsData = jsonData.data.packs.filter(a => a.sku.expansion.expansionId == exp && !a.name.includes('Promo Pack A Series'));
    setsData = jsonData.data.expansions.filter(a => a.expansionId == exp);
  } else {
    pokemonCards = jsonData.data.cards.filter(a => a.pokemon);
    trainerCards = jsonData.data.cards.filter(a => a.trainer);
    packsData = jsonData.data.packs.filter(a => !a.name.includes('Promo Pack A Series'));
    setsData = jsonData.data.expansions;
  }

  let imgURLs = [];
  let packs = ["Shop", "Campaign", "Mission", "Wonder Pick", "Promo Pack"];
  let sets = [];
  let gameData = [];

  // Packs and Sets
  packsData.forEach(a => {
    packs.push(a.name);
    const URI = "Packs%2F" + a.name.replace(/ /g, "_") + ".webp";
    imgURLs.push({ getUrl: a.iconAssetUrl, postUrl: URI });
  });

  setsData.forEach(a => {
    sets.push(a.name);
    const URI = "Sets%2F" + a.name.replace(/ /g, "_") + ".webp";
    imgURLs.push({ getUrl: a.logoAssetUrl, postUrl: URI });
  });

  // --- Pokemon Cards ---
  pokemonCards.forEach(a => {
    gameData.push(buildPokemonCard(a, pokemonCards, rarityObj, gens));
  });

  // --- Trainer Cards ---
  trainerCards.forEach(a => {
    gameData.push(buildTrainerCard(a, pokemonCards, rarityObj));
  });

  return gameData;
}

async function syncPokemonCount() {
  const response = await axios.get('https://www.pokemon-zone.com/api/players/5811072974828985/');
  const cardList = response.data.data.cards;
  return cardList.map(card => ({
    cardId: card.cardId,
    count: card.amount,
    firstReceivedAt: card.firstReceivedAt,
    lastReceivedAt: card.lastReceivedAt
  }));
}

// --- Optional: Image Upload Function ---
async function fetchAndPost(imgURLs) {
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
  const responses = await Promise.all(imgURLs.map(({ getUrl }) => fetch(getUrl)));
  const data = await Promise.all(responses.map(res => res.arrayBuffer()));

  await Promise.all(
    data.map((item, index) =>
      fetch(`https://firebasestorage.googleapis.com/v0/b/ptcgp-d1101.firebasestorage.app/o/${imgURLs[index].postUrl}`, {
        method: "POST",
        body: item
      })
    )
  );
}

// --- API Endpoints ---

app.get('/full', async (req, res) => {
  try {
    const data = await fetchPokemonData();
    // Uncomment below to upload images and patch to Firebase
    // await fetchAndPost(imgURLs);
    await fetch(SUPABASE_URL + 'PTCGP', {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify(data)
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/delta/:exp', async (req, res) => {
  try {
    const exp = req.params.exp;
    const data = await fetchPokemonData(exp);
    await fetch(SUPABASE_URL + 'PTCGP', {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify(data)
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/sync', async (req, res) => {
  try {
    const data = await syncPokemonCount();
    await fetch(SUPABASE_URL + 'Count', {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify(data)
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/test', (req, res) => {
  res.send("Test endpoint is working!");
});

app.listen(3000, () => {
  console.log(`Server is running at http://localhost:3000`);
});