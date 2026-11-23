
import "dotenv/config";
import { faker } from "@faker-js/faker";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// Change this to generate more or fewer listings.
const TOTAL_LISTINGS = 1000;

// Must exist in the users table.
const OWNER_ID = "owner_ravi";

// Real neighborhood centers; individual properties are fictional.
const locations = [
  {
    city: "Bangalore",
    area: "Koramangala",
    lat: 12.9352,
    lng: 77.6197,
  },
  {
    city: "Bangalore",
    area: "Indiranagar",
    lat: 12.9784,
    lng: 77.6408,
  },
  {
    city: "Bangalore",
    area: "HSR Layout",
    lat: 12.9116,
    lng: 77.6500,
  },
  {
    city: "Pune",
    area: "Hinjewadi",
    lat: 18.5913,
    lng: 73.7389,
  },
  {
    city: "Mumbai",
    area: "Andheri",
    lat: 19.1197,
    lng: 72.8464,
  },
  {
    city: "Hyderabad",
    area: "Gachibowli",
    lat: 17.4401,
    lng: 78.3489,
  },
  {
    city: "Nagpur",
    area: "Dharampeth",
    lat: 21.1458,
    lng: 79.0630,
  },
];

const propertyTypes = ["PG", "FLAT", "SHARED"] as const;

const descriptions = [
  "Well-maintained property with WiFi and parking.",
  "Comfortable accommodation near local markets.",
  "Furnished rental with convenient transport access.",
  "Spacious property with modern amenities.",
  "Affordable accommodation suitable for students.",
  "Rental property with security and power backup.",
];

function generateListing(index: number) {
  const place = faker.helpers.arrayElement(locations);
  const type = faker.helpers.arrayElement(propertyTypes);

  // Small offsets place fictional properties near the locality.
  const latitude = place.lat + faker.number.float({
    min: -0.012,
    max: 0.012,
    fractionDigits: 5,
  });

  const longitude = place.lng + faker.number.float({
    min: -0.012,
    max: 0.012,
    fractionDigits: 5,
  });

  const rentRanges = {
    PG: [4000, 15000],
    FLAT: [10000, 50000],
    SHARED: [3000, 12000],
  } as const;

  const [minRent, maxRent] = rentRanges[type];

  const rent = faker.number.int({
    min: minRent,
    max: maxRent,
    multipleOf: 500,
  });

  const titlePrefix = {
    PG: "Furnished PG",
    FLAT: "Rental Apartment",
    SHARED: "Shared Room",
  }[type];

  return {
    id: `demo_faker_${String(index).padStart(6, "0")}`,
    title: `${titlePrefix} near ${place.area}`,
    description: faker.helpers.arrayElement(descriptions),
    rent,
    propertyType: type,
    address: `Demo property, ${place.area}, ${place.city}`,
    latitude,
    longitude,
  };
}

async function insertListing(
  listing: ReturnType<typeof generateListing>
) {
  await prisma.$executeRaw`
    INSERT INTO listings (
      id,
      title,
      description,
      rent,
      "propertyType",
      address,
      location,
      images,
      "userId",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${listing.id},
      ${listing.title},
      ${listing.description},
      ${listing.rent},
      ${listing.propertyType}::"PropertyType",
      ${listing.address},
      ST_SetSRID(
        ST_MakePoint(
          ${listing.longitude},
          ${listing.latitude}
        ),
        4326
      )::geography,
      ARRAY[]::text[],
      ${OWNER_ID},
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

async function main() {
  // Same generated data on each run.
  faker.seed(12345);

  const owner = await prisma.user.findUnique({
    where: { id: OWNER_ID },
  });

  if (!owner) {
    throw new Error(
      `Owner ${OWNER_ID} not found. Seed your users first.`
    );
  }

  console.log(`Generating ${TOTAL_LISTINGS} demo properties...`);

  // Insert in small batches to avoid overloading Neon.
  const BATCH_SIZE = 10;

  for (let start = 1; start <= TOTAL_LISTINGS; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, TOTAL_LISTINGS);

    const listings = [];

    for (let i = start; i <= end; i++) {
      listings.push(generateListing(i));
    }

    await Promise.all(listings.map(insertListing));

    if (end % 100 === 0 || end === TOTAL_LISTINGS) {
      console.log(`Processed ${end}/${TOTAL_LISTINGS}`);
    }
  }

  console.log("Demo seeding complete!");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
