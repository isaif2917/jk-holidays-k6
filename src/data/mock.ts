import maldives from "@/assets/dest-maldives.jpg";
import bali from "@/assets/dest-bali.jpg";
import dubai from "@/assets/dest-dubai.jpg";
import thailand from "@/assets/dest-thailand.jpg";
import kashmir from "@/assets/dest-kashmir.jpg";
import goa from "@/assets/dest-goa.jpg";

export const destinations = [
  { name: "Maldives", country: "Overwater Villas", image: maldives },
  { name: "Bali", country: "Indonesia", image: bali },
  { name: "Dubai", country: "UAE", image: dubai },
  { name: "Thailand", country: "Krabi", image: thailand },
  { name: "Kashmir", country: "India", image: kashmir },
  { name: "Goa", country: "India", image: goa },
];

export const CONTACT = {
  company: "JK Holidays Pvt. Ltd.",
  address: "B-04, Sector 63, Noida,\nUttar Pradesh - 201301",
  phone: "9019663540",
  phoneHref: "tel:9019663540",
  whatsapp: "https://wa.me/919019663540",
  email: "info@jkholidays.com",
};

/** Featured holiday packages — photos, ratings and enquiry options. */
export const holidayPackages = [
  {
    slug: "maldives",
    name: "Maldives Holiday Package",
    location: "Maldives",
    tag: "OVERWATER VILLAS",
    duration: "4 Nights / 5 Days",
    rating: 4.9,
    reviews: 312,
    photos: [maldives, bali, thailand, goa],
    highlights: ["Overwater villa stay", "Seaplane transfers", "Candlelight dinner"],
  },
  {
    slug: "bali",
    name: "Bali Holiday Package",
    location: "Indonesia",
    tag: "HONEYMOON FAVOURITE",
    duration: "5 Nights / 6 Days",
    rating: 4.8,
    reviews: 486,
    photos: [bali, thailand, maldives, kashmir],
    highlights: ["Private pool villa", "Ubud & Kintamani tour", "Spa session included"],
  },
  {
    slug: "dubai",
    name: "Dubai Holiday Package",
    location: "UAE",
    tag: "FAMILY ESCAPE",
    duration: "4 Nights / 5 Days",
    rating: 4.8,
    reviews: 524,
    photos: [dubai, maldives, thailand, goa],
    highlights: ["Burj Khalifa tickets", "Desert safari with BBQ", "Dhow cruise dinner"],
  },
  {
    slug: "thailand",
    name: "Thailand Holiday Package",
    location: "Krabi & Phuket",
    tag: "GROUP HOLIDAY",
    duration: "5 Nights / 6 Days",
    rating: 4.7,
    reviews: 398,
    photos: [thailand, bali, maldives, dubai],
    highlights: ["Phi Phi island tour", "Beachfront resort", "Airport transfers"],
  },
  {
    slug: "kashmir",
    name: "Kashmir Holiday Package",
    location: "India",
    tag: "VALLEY TOUR",
    duration: "5 Nights / 6 Days",
    rating: 4.9,
    reviews: 271,
    photos: [kashmir, goa, dubai, bali],
    highlights: ["Houseboat stay on Dal Lake", "Gulmarg gondola ride", "Pahalgam day trip"],
  },
  {
    slug: "goa",
    name: "Goa Holiday Package",
    location: "India",
    tag: "WEEKEND GETAWAY",
    duration: "3 Nights / 4 Days",
    rating: 4.6,
    reviews: 640,
    photos: [goa, maldives, thailand, bali],
    highlights: ["Beach resort stay", "North & South Goa tour", "Sunset cruise"],
  },
];

export type PlanTier = "Silver" | "Gold" | "Platinum";


export const plans: Array<{
  name: PlanTier;
  original: number;
  price: number;
  nights: string;
  validity: string;
  badge?: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    name: "Silver",
    original: 30000,
    price: 15000,
    nights: "2 Nights / 3 Days",
    validity: "1 Year Validity",
    features: [
      "Premium Resort Stay",
      "Member Exclusive Holiday Offers",
      "Customer Support",
    ],
  },
  {
    name: "Gold",
    original: 50000,
    price: 25000,
    nights: "4 Nights / 5 Days",
    validity: "2 Years Validity",
    badge: "MOST POPULAR",
    highlight: true,
    features: [
      "Premium Resort Stay",
      "Priority Member Support",
      "Exclusive Member Discounts",
      "Seasonal Member Offers",
    ],
  },
  {
    name: "Platinum",
    original: 100000,
    price: 50000,
    nights: "10 Nights / 11 Days",
    validity: "5 Years Validity",
    badge: "BEST VALUE",
    features: [
      "Premium Resort Stay",
      "Priority Booking",
      "Exclusive Member Benefits",
      "FREE Bali or Thailand Trip",
      "VIP Customer Support",
    ],
  },
];

export const whyUs = [
  { title: "Lifetime Memories", desc: "Create unforgettable memories with your loved ones." },
  { title: "Affordable Luxury", desc: "Enjoy 5-star stays at a fraction of the cost." },
  { title: "Exclusive Benefits", desc: "Special member discounts and insider privileges." },
  { title: "EMI Options", desc: "Flexible payment options to suit your needs." },
  { title: "Travel Concierge", desc: "Dedicated support before, during & after your holiday." },
  { title: "Domestic & International", desc: "Explore 1000+ destinations across India & the world." },
];

export const howItWorks = [
  { step: 1, title: "Register", desc: "Fill a simple form to register with us." },
  { step: 2, title: "Attend Presentation", desc: "Join our free presentation online or offline." },
  { step: 3, title: "Choose Membership", desc: "Select the right membership plan for you." },
  { step: 4, title: "Start Travelling", desc: "Enjoy holidays with your loved ones." },
];

export const stats = [
  { value: "10,000+", label: "Happy Families" },
  { value: "500+", label: "Premium Resorts" },
  { value: "25+", label: "Countries" },
  { value: "24/7", label: "Member Support" },
];

export const offers = [
  { title: "Early Bird Offer", pct: "50% OFF", desc: "On Domestic Holidays", tone: "from-rose-500 to-rose-700" },
  { title: "International Offer", pct: "40% OFF", desc: "On Group Bookings", tone: "from-indigo-600 to-purple-700" },
  { title: "Weekend Getaway", pct: "25% OFF", desc: "On Select Resorts", tone: "from-teal-500 to-cyan-700" },
  { title: "Festive Special", pct: "35% OFF", desc: "On All Holidays", tone: "from-amber-500 to-orange-700" },
];

export const testimonials = [
  { name: "Rahul & Family", plan: "Gold Member", quote: "Amazing experience with JK Holidays. We explored the Maldives at an unbelievable price. Highly Recommended!" },
  { name: "Neha & Amit", plan: "Platinum Member", quote: "JK Holidays made our dream vacation to Bali so special. Excellent support and services." },
  { name: "Suresh & Family", plan: "Gold Member", quote: "Best membership decision ever! We save more and travel more with JK Holidays." },
];

export const recentBookings = [
  { dest: "Maldives", nights: "3 Nights / 4 Days", dates: "10 Feb 2024 – 13 Feb 2024", status: "Completed" as const, image: maldives },
  { dest: "Manali, Himachal", nights: "4 Nights / 5 Days", dates: "22 Dec 2023 – 26 Dec 2023", status: "Completed" as const, image: kashmir },
  { dest: "Dubai", nights: "4 Nights / 5 Days", dates: "05 Oct 2023 – 09 Oct 2023", status: "Completed" as const, image: dubai },
];

// Admin members
export const members = Array.from({ length: 24 }).map((_, i) => {
  const plans: PlanTier[] = ["Gold", "Silver", "Platinum", "Gold", "Silver"];
  const names = ["Rahul Sharma", "Neha Verma", "Amit Kumar", "Pooja Singh", "Vikram Mehta", "Sneha Patel", "Manish Joshi", "Anjali Desai", "Suresh Nair", "Kavita Reddy"];
  return {
    id: `JKM${10001 + i}`,
    name: names[i % names.length],
    mobile: `98765432${(10 + i).toString().slice(-2)}`,
    email: `${names[i % names.length].split(" ")[0].toLowerCase()}${i}@email.com`,
    plan: plans[i % plans.length],
    joined: `${15 - (i % 14)} May 2026`,
    active: i % 7 !== 0,
  };
});

export const requests = [
  { id: "JK10254", dest: "Goa", dates: "15 Jun 2026 – 19 Jun 2026", nights: "4N / 5D", status: "Pending" as const, requested: "12 May 2026", member: "Rahul Sharma" },
  { id: "JK10198", dest: "Manali", dates: "20 Apr 2026 – 24 Apr 2026", nights: "4N / 5D", status: "Approved" as const, requested: "10 Apr 2026", member: "Neha Verma" },
  { id: "JK10120", dest: "Bali", dates: "05 Mar 2026 – 09 Mar 2026", nights: "4N / 5D", status: "Rejected" as const, requested: "02 Mar 2026", member: "Amit Kumar" },
  { id: "JK10075", dest: "Dubai", dates: "10 Feb 2026 – 14 Feb 2026", nights: "4N / 5D", status: "Approved" as const, requested: "01 Feb 2026", member: "Pooja Singh" },
];

export const transactions = [
  { date: "15 May 2024", time: "10:30 AM", desc: "Referral Bonus", sub: "From: Amit Verma (JK1254)", type: "Credit" as const, amount: 2500, balance: 25630 },
  { date: "12 May 2024", time: "04:15 PM", desc: "Binary Commission", sub: "Level Income", type: "Credit" as const, amount: 3750, balance: 23130 },
  { date: "10 May 2024", time: "11:20 AM", desc: "Withdrawal Request", sub: "UTR: JKWD123456", type: "Debit" as const, amount: 10000, balance: 19380 },
  { date: "08 May 2024", time: "09:45 AM", desc: "Matching Bonus", sub: "Team Income", type: "Credit" as const, amount: 1800, balance: 29380 },
  { date: "05 May 2024", time: "03:30 PM", desc: "Referral Bonus", sub: "From: Neha Singh (JK2587)", type: "Credit" as const, amount: 2000, balance: 27580 },
];

/** Dedicated membership package pages (Silver Escape / Gold Horizon / Platinum Voyage). */
export const membershipPackages = [
  {
    slug: "silver-escape",
    title: "Silver Escape",
    tier: "Silver" as PlanTier,
    tagline: "A refined short-break membership for premium resort stays.",
    about:
      "Silver Escape is designed for couples and small families who want curated luxury without the planning stress. Enjoy premium resort stays, member-only holiday offers, and dedicated support across select domestic destinations.",
    nights: "2 Nights / 3 Days",
    validity: "1 Year Validity",
    original: 30000,
    price: 15000,
    image: goa,
    included: [
      "Premium Resort Stay",
      "Member Exclusive Holiday Offers",
      "Customer Support",
      "Breakfast included",
    ],
  },
  {
    slug: "gold-horizon",
    title: "Gold Horizon",
    tier: "Gold" as PlanTier,
    badge: "MOST POPULAR",
    tagline: "Our most popular plan for longer escapes and priority perks.",
    about:
      "Gold Horizon unlocks longer stays, priority member support, and seasonal discounts. Perfect for families who want multiple getaways with hotel stays, curated meals, and leisure activities included in the membership experience.",
    nights: "4 Nights / 5 Days",
    validity: "2 Years Validity",
    original: 50000,
    price: 25000,
    image: kashmir,
    included: [
      "Premium Resort Stay",
      "Priority Member Support",
      "Exclusive Member Discounts",
      "Seasonal Member Offers",
      "Food & leisure activities",
    ],
  },
  {
    slug: "platinum-voyage",
    title: "Platinum Voyage",
    tier: "Platinum" as PlanTier,
    badge: "BEST VALUE",
    tagline: "Flagship membership with VIP privileges and international flair.",
    about:
      "Platinum Voyage is the flagship JK Holidays plan — extended nights, priority booking, VIP support, and elevated international opportunities. Built for members who want premium hotel stays, dining, trekking options, and signature tourism experiences.",
    nights: "10 Nights / 11 Days",
    validity: "5 Years Validity",
    original: 100000,
    price: 50000,
    image: maldives,
    included: [
      "Premium Resort Stay",
      "Priority Booking",
      "Exclusive Member Benefits",
      "Complimentary Bali or Thailand trip opportunity",
      "VIP Customer Support",
      "Hotel, food, trekking & tourism activities",
    ],
  },
];

export const planSlug: Record<PlanTier, string> = {
  Silver: "silver-escape",
  Gold: "gold-horizon",
  Platinum: "platinum-voyage",
};
