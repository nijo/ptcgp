import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': '*'
};
// --- Environment Variables ---
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
// --- Helper Functions ---
let images = [];
async function uploadImagesParallel(images) {
  for (const img of images){
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      const filePath = `${img.base}${img.id}.webp`; // unique filename
      const { data, error } = await supabase.storage.from('ptcgp').upload(filePath, blob, {
        contentType: blob.type,
        upsert: true
      });
      if (error) {
        console.error(`Error uploading ${img.url}:`, error);
      } else {
        console.log(`Uploaded ${img.url} to ${filePath}`);
      }
    } catch (err) {
      console.error(`Failed to fetch ${img.url}:`, err);
    }
  }
}
function removeHtmlTags(str) {
  return str ? str.replace(/<[^>]*>/g, "") : "";
}
function formatEnergyTags(str) {
  return str ? str.replace(/<span class="energy-text energy-text--type-(\w+)"><\/span>/g, (_, type)=>type.charAt(0).toUpperCase() + type.slice(1)) : "";
}
function getEvolvesInto(name, pokemonCards) {
  const arr = pokemonCards.filter((b)=>b.pokemon?.previousEvolution?.name === name).map((b)=>b.name);
  return [
    ...new Set(arr)
  ].sort().toString().replaceAll(',', ', ');
}
function countVariants(name, pokemonCards) {
  const dm = pokemonCards.filter((b)=>b.name === name && (b.rarityName === 'Common' || b.rarityName === 'Uncommon' || b.rarityName === 'Rare' || b.rarityName === 'Double Rare')).length;
  const st = pokemonCards.filter((b)=>b.name === name && (b.rarityName === 'Art Rare' || b.rarityName === 'Super Rare' || b.rarityName === 'Immersive Rare' || b.rarityName === 'Special Art Rare')).length;
  const sh = pokemonCards.filter((b)=>b.name === name && (b.rarityName === 'Shiny' || b.rarityName === 'Shiny Super Rare')).length;
  const cr = pokemonCards.filter((b)=>b.name === name && b.rarityName === 'Crown Rare').length;
  return dm + ', ' + st + ', ' + sh + ', ' + cr;
}
function formatPack(a) {
  if (a.isPromotion) {
    let packName = a.promotionCardSource.replace(/Obtained from (a|the) /, "");
    return packName.charAt(0).toUpperCase() + packName.slice(1).toLowerCase();
  }
  const arr = a.availablePacks?.length > 0 ? a.availablePacks.map((b)=>b.name) : [];
  return [
    ...new Set(arr)
  ].sort().toString().replaceAll(',', ', ');
}
// --- Card Builders ---
function buildPokemonCard(a, pokemonCards, rarityObj, gens) {
  const abilityInfo = a.pokemon.pokemonAbilities?.length > 0 ? {
    description: removeHtmlTags(formatEnergyTags(a.pokemon.pokemonAbilities[0].description)),
    name: a.pokemon.pokemonAbilities[0].name
  } : {
    description: "",
    name: ""
  };
  const abilityDescription = abilityInfo.description;
  const abilityName = abilityInfo.name;
  const attackInfo = a.pokemon.pokemonAttacks?.length > 0 ? a.pokemon.pokemonAttacks.map((ak)=>({
      attackCost: Array.isArray(ak.attackCost) && ak.attackCost.length > 0 ? ak.attackCost.join(", ") : "NA",
      attackDamage: ak.damage,
      attackExtra: removeHtmlTags(formatEnergyTags(ak.description)),
      attackName: ak.name,
      attackSymbol: ak.damageSymbolLabel || ""
    })) : "NA";
  const attackOneCost = attackInfo[0]?.attackCost ? attackInfo[0]?.attackCost : "";
  const attackOneDamage = attackInfo[0]?.attackDamage ? attackInfo[0]?.attackDamage : "";
  const attackOneExtra = attackInfo[0]?.attackExtra ? attackInfo[0]?.attackExtra : "";
  const attackOneName = attackInfo[0]?.attackName ? attackInfo[0]?.attackName : "";
  const attackOneSymbol = attackInfo[0]?.attackSymbol ? attackInfo[0]?.attackSymbol : "";
  const attackTwoCost = attackInfo[1]?.attackCost ? attackInfo[1]?.attackCost : "";
  const attackTwoDamage = attackInfo[1]?.attackDamage ? attackInfo[1]?.attackDamage : "";
  const attackTwoExtra = attackInfo[1]?.attackExtra ? attackInfo[1]?.attackExtra : "";
  const attackTwoName = attackInfo[1]?.attackName ? attackInfo[1]?.attackName : "";
  const attackTwoSymbol = attackInfo[1]?.attackSymbol ? attackInfo[1]?.attackSymbol : "";
  const name = a.name;
  const evolvesFrom = a.pokemon.previousEvolution?.name ?? "";
  const evolvesInto = getEvolvesInto(name, pokemonCards);
  const hp = a.pokemon.hp;
  const info = removeHtmlTags(a.flavorText);
  const pack = formatPack(a);
  const mirrorType = a.mirrorTypeLabel;
  const setId = a.expansionCollectionNumbers.expansionId;
  const retreatCost = a.pokemon.retreatAmount;
  const rarity = rarityObj[a.rarityName];
  const series = a.seriesId;
  const slNo = `${a.expansionCollectionNumbers.expansionId.toUpperCase()}-${a.expansionCollectionNumbers.collectionNumber.toString().padStart(3, "0")}`;
  const stage = a.pokemon.evolutionLabel;
  const type = a.pokemon.pokemonTypes[0];
  const weakness = a.pokemon.weaknessType !== "UNSPECIFIED" ? a.pokemon.weaknessType : "";
  const description = removeHtmlTags(formatEnergyTags(a.description));
  const pokedexId = a.pokedexNumber;
  const generation = gens.findIndex(([start, end])=>pokedexId >= start && pokedexId <= end) + 1;
  const variants = countVariants(name, pokemonCards);
  const packPoints = a.dustCost;
  const illustrator = a.illustratorNames.toString();
  const cardId = a.cardId;
  const imgUrl = a.illustrationUrl;
  return {
    cardId,
    abilityName,
    abilityDescription,
    attackOneCost,
    attackOneDamage,
    attackOneExtra,
    attackOneName,
    attackOneSymbol,
    attackTwoCost,
    attackTwoDamage,
    attackTwoExtra,
    attackTwoName,
    attackTwoSymbol,
    cardType: "Pokemon",
    evolvesFrom,
    evolvesInto,
    name,
    hp,
    info,
    pack,
    setId,
    rarity,
    retreatCost,
    slNo,
    stage,
    type,
    weakness,
    description,
    pokedexId,
    variants,
    packPoints,
    generation,
    illustrator,
    imgUrl,
    mirrorType,
    series
  };
}
function buildTrainerCard(a, pokemonCards, rarityObj) {
  const name = a.name;
  const evolvesInto = getEvolvesInto(name, pokemonCards);
  const pack = formatPack(a);
  const setId = a.expansionCollectionNumbers.expansionId;
  const rarity = rarityObj[a.rarityName];
  const slNo = `${a.expansionCollectionNumbers.expansionId.toUpperCase()}-${a.expansionCollectionNumbers.collectionNumber.toString().padStart(3, "0")}`;
  const stage = a.trainer.trainerType;
  const description = removeHtmlTags(formatEnergyTags(a.description));
  const variants = countVariants(name, pokemonCards);
  const packPoints = a.dustCost;
  const illustrator = a.illustratorNames.toString();
  const cardId = a.cardId;
  const series = a.seriesId;
  const imgUrl = a.illustrationUrl;
  const mirrorType = a.mirrorTypeLabel;
  return {
    cardId,
    abilityName: "",
    abilityDescription: "",
    attackOneCost: "",
    attackOneDamage: "",
    attackOneExtra: "",
    attackOneName: "",
    attackOneSymbol: "",
    attackTwoCost: "",
    attackTwoDamage: "",
    attackTwoExtra: "",
    attackTwoName: "",
    attackTwoSymbol: "",
    cardType: "Trainer",
    evolvesFrom: "",
    evolvesInto,
    name,
    hp: 0,
    info: "",
    pack,
    setId,
    rarity,
    retreatCost: 0,
    slNo,
    stage,
    type: "",
    weakness: "",
    description,
    pokedexId: -1,
    variants,
    packPoints,
    generation: -1,
    illustrator,
    imgUrl,
    mirrorType,
    series
  };
}
// --- Main Data Fetch & Transform ---
async function fetchPokemonData(text) {
  const parsed = JSON.parse(text);
  const gens = [
    [
      1,
      151
    ],
    [
      152,
      251
    ],
    [
      252,
      386
    ],
    [
      387,
      493
    ],
    [
      494,
      649
    ],
    [
      650,
      721
    ],
    [
      722,
      809
    ],
    [
      810,
      905
    ],
    [
      906,
      1025
    ]
  ];
  const rarityObj = {
    "Common": "◇",
    "Uncommon": "◇◇",
    "Rare": "◇◇◇",
    "Double Rare": "◇◇◇◇",
    "Art Rare": "☆",
    "Super Rare": "☆☆",
    "Immersive Rare": "☆☆☆",
    "Crown Rare": "♛",
    "Special Art Rare": "☆☆",
    "Shiny": "✸",
    "Shiny Super Rare": "✸✸"
  };
  let pokemonCards = parsed.filter((a)=>a.pokemon);
  let trainerCards = parsed.filter((a)=>a.trainer);
  let gameData = [];
  pokemonCards.forEach((a)=>{
    gameData.push(buildPokemonCard(a, pokemonCards, rarityObj, gens));
  });
  trainerCards.forEach((a)=>{
    gameData.push(buildTrainerCard(a, pokemonCards, rarityObj));
  });
  return gameData;
}
async function syncPokemonCount(text) {
  const cardList = JSON.parse(text);
  return cardList.map((card)=>({
      cardId: card.cardId,
      count: card.amount,
      firstReceivedAt: card.firstReceivedAt,
      lastReceivedAt: card.lastReceivedAt
    }));
}
async function fetchSets(text) {
  const sets = JSON.parse(text);
  let gameData = [];
  let expansions = sets.expansions.filter((a)=>!a.isPromo);
  expansions.forEach((a)=>{
    let packs = sets.packs.filter((b)=>b.packId.startsWith(a.packIds[0].substring(0, 5)));
    let packOneName = packs[0]?.name;
    let packOneImage = packs[0]?.iconAssetUrl;
    images.push({
      'id': packOneName,
      'url': packOneImage,
      'base': 'Packs/'
    });
    let packTwoName = packs[1]?.name;
    let packTwoImage = packs[1]?.iconAssetUrl;
    images.push({
      'id': packTwoName,
      'url': packTwoImage,
      'base': 'Packs/'
    });
    let packThreeName = packs[2]?.name;
    let packThreeImage = packs[2]?.iconAssetUrl;
    images.push({
      'id': packThreeName,
      'url': packThreeImage,
      'base': 'Packs/'
    });
    let expansionId = a.expansionId;
    let cardCount = a.cardCount;
    let image = a.logoAssetUrl;
    images.push({
      'id': expansionId,
      'url': image,
      'base': 'Sets/'
    });
    let name = a.name;
    let series = a.expansionId.substring(0, 1).toUpperCase();
    let realeased = a.displaySchedule.openAt;
    gameData.push({
      packOneName,
      packOneImage,
      packTwoName,
      packTwoImage,
      packThreeName,
      packThreeImage,
      expansionId,
      cardCount,
      image,
      name,
      realeased,
      series
    });
  });
  expansions = sets.expansions.filter((a)=>a.isPromo);
  expansions.forEach((a)=>{
    let packs = sets.packs.filter((b)=>b.packId.startsWith(a.packIds[0].substring(0, 5)));
    let packOneName = "Wonder pick";
    let packOneImage = "";
    let packTwoName = "Promo pack";
    let packTwoImage = "";
    let packThreeName = "Campaign, Mission, Shop";
    let packThreeImage = "";
    let expansionId = a.expansionId;
    let cardCount = 0;
    let image = a.logoAssetUrl;
    images.push({
      'id': expansionId,
      'url': image,
      'base': 'Sets/'
    });
    let name = a.name;
    let series = a.expansionId.substring(6, 7).toUpperCase();
    let realeased = a.displaySchedule.openAt;
    gameData.push({
      packOneName,
      packOneImage,
      packTwoName,
      packTwoImage,
      packThreeName,
      packThreeImage,
      expansionId,
      cardCount,
      image,
      name,
      series,
      realeased
    });
  });
  return gameData;
}
// --- API Endpoints ---
serve(async (req)=>{
  const url = new URL(req.url);
  const pathname = url.pathname;
  if (pathname.includes("full")) {
    const text = await req.text();
    const data = await fetchPokemonData(text);
    const { dt, error } = await supabase.storage.from("json").upload("files/card_list.json", text, {
      upsert: true
    });
    const resp = await supabase.from("card_list").upsert(data);
    uploadImagesParallel(images);
    return new Response(JSON.stringify(resp), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } else if (pathname.includes("sync")) {
    const text = await req.text();
    const data = await syncPokemonCount(text);
    const { dt, error } = await supabase.storage.from("json").upload("files/card_count.json", text, {
      upsert: true
    });
    const resp = await supabase.from("card_count").upsert(data);
    return new Response(JSON.stringify(resp), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } else if (pathname.includes("set")) {
    const text = await req.text();
    const data = await fetchSets(text);
    const { dt, error } = await supabase.storage.from("json").upload("files/sets.json", text, {
      upsert: true
    });
    const resp = await supabase.from("sets").upsert(data);
    return new Response(JSON.stringify(resp), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } else {
    return new Response("Test endpoint is working!", {
      headers: {
        ...corsHeaders
      },
      status: 200
    });
  }
});
