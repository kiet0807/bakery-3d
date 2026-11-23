import type { FaqItem, PagesDict, PolicyId, PolicySection } from '../vi/pages'

const policySections: Record<PolicyId, PolicySection> = {
  delivery: {
    title: 'Pickup and delivery',
    summary: 'Pick it up at the shop, or we book a ride to bring it to you.',
    blocks: [
      {
        heading: 'Pick up at the shop',
        text: 'The shop is in the Thủ Đức area, open 6:30–22:45 every day. Your cake waits in the fridge at the time you picked.',
      },
      {
        heading: 'Delivery',
        items: [
          'Delivery runs 8:00–21:30; you pick a 30-minute window when you order.',
          'We book Grab, Be or Ahamove to your address. The fee is whatever the app charges when we book; we tell you first, and you pay the driver or add it to your bank transfer.',
          'Cakes of 20 cm and two-tier cakes travel by car to stay safe (a higher fee), or you can pick them up.',
        ],
      },
      {
        heading: 'Where we deliver',
        text: "Ho Chi Minh City's old inner districts, listed by the names everyone still uses (from before the July 2025 merger):",
        areas: true,
      },
      {
        heading: 'How far ahead to order',
        table: {
          head: ['Order', 'Order at least'],
          rows: [
            [
              'A house cake from the menu, 10–20 cm',
              '4 hours ahead. For same-day pickup, order before 18:00',
            ],
            ['A cake you designed on the site', '24 hours ahead'],
            [
              'A cake copied from your photo, or an elaborate design',
              '48 hours ahead, send the photo on Zalo',
            ],
            ['Two-tier cakes', '48 hours ahead'],
            [
              'Holidays (Jan 1, Feb 14, Mar 8, Jun 1, Oct 20, Nov 20, Dec 24–25, the 7 days before Tết and its first 3 days)',
              '48 hours ahead for every order',
            ],
          ],
        },
        text: 'Times follow Vietnam time, even if you order from abroad for your family.',
      },
    ],
  },
  payment: {
    title: 'Payment and deposits',
    summary: 'Pay on delivery, by bank transfer or MoMo. Big orders need a 50% deposit.',
    blocks: [
      {
        items: [
          'Cash on delivery (COD), bank transfer (VietQR) or MoMo; you choose when you order.',
          'Menu cakes and your own designs up to 20 cm: no deposit, except in the cases below. We text or call to confirm before we bake.',
        ],
      },
      {
        heading: 'When a 50% deposit is needed',
        items: [
          'A cake copied from your photo',
          'Two-tier cakes',
          'Orders from 1,000,000 VND',
          'Holiday orders',
        ],
        text: 'Pay the deposit by bank transfer or MoMo and the rest when you receive the cake. The deposit lets us buy ingredients for big orders without worrying about orders that never show up.',
      },
    ],
  },
  changes: {
    title: 'Canceling or changing an order',
    summary: 'Tell us 24 hours ahead and it costs nothing.',
    blocks: [
      {
        heading: '24 hours or more before your time',
        items: [
          'Cancel for free and get 100% of the deposit back (or keep it for next time if you like).',
          'Change the day, time, flavor or message for free.',
        ],
      },
      {
        heading: 'Less than 24 hours before',
        items: [
          "A menu cake we haven't started: still free to cancel.",
          'A cake we have already started (photo designs, two tiers, holiday orders): we keep the deposit to cover ingredients.',
          'Moving the time within the same day: we will do our best to make it work.',
        ],
      },
    ],
  },
  damage: {
    title: 'Faulty or damaged cakes',
    summary: "Take a photo and text us within 2 hours. If it's on us, we remake it or refund you.",
    blocks: [
      {
        text: 'Open the box as soon as it arrives, in front of the driver if you can. If something is wrong, take a photo or video and text us on Zalo within 2 hours.',
      },
      {
        items: [
          "Our mistake (wrong design, wrong message, wrong flavor, not up to standard): we remake it for free if there's time, or refund the cake in full.",
          "Damaged on a ride we booked (dented, tipped over): we fix or remake it for free if there's time, otherwise we refund the cake. We deal with the delivery app, not you.",
          "You carried it, booked your own ride, or stored it wrong (left in the sun, kept too long): no refund, but we'll tell you how to rescue it if we can.",
          "Taste is personal, so it isn't grounds for a refund. We'd still love to hear what you think, honestly.",
        ],
      },
    ],
  },
  storage: {
    title: 'Storage',
    summary: 'Fridge at 2–6°C, best within 24 hours.',
    blocks: [
      {
        items: [
          'Put the cake in the fridge (2–6°C) as soon as you get it. Never in the freezer.',
          "Take it out 15–20 minutes before cutting so the cream softens. Don't leave it out for more than an hour, less when it's hot.",
          'Best within 24 hours, finish it within 48, covered in its box. Cakes with fresh fruit are best eaten the same day.',
          'Carrying it yourself: keep the box flat and out of the sun. Take a car for 20 cm and two-tier cakes.',
        ],
      },
    ],
  },
  allergens: {
    title: 'Ingredients and allergens',
    summary: 'Every cake has egg, milk and wheat. Some choices add soy or nuts.',
    blocks: [
      {
        text: "The frosting is dairy whipping cream beaten with cream cheese, which we call cream-cheese whipped cream. We don't use vegetable cream. Colors come from ingredients such as freeze-dried strawberry, cocoa and taro.",
      },
      { heading: 'In every cake', text: 'Egg, milk, wheat (gluten).' },
      {
        heading: 'Depending on your choices',
        items: [
          'Chocolate sponge, ganache, milk chocolate frosting, chocolate drip, chocolate shards: soy (lecithin).',
          'Macarons (made with almond flour) and pistachio frosting: tree nuts.',
        ],
      },
      {
        text: "Our kitchen shares tools with nuts, so we can't promise zero traces of allergens. If your allergy is serious, text Kai before you order.",
      },
    ],
  },
  privacy: {
    title: 'Personal data',
    summary: "The site doesn't send your information anywhere.",
    blocks: [
      {
        items: [
          'No accounts, no cookies, no analytics or advertising tools.',
          'Your cart and the cake you are designing are stored only in this browser (localStorage), so they are still there next time. Nothing is sent anywhere.',
          "The name, phone number and address you type at checkout are not sent to or stored on any server. The shop isn't real, so every order is a demo.",
          'The "Send this design to the shop" link carries the whole cake, message included, after the # in the link. Browsers never send that part to a server, but anyone with the link can see your cake.',
          'When you call, or message on Zalo, Facebook, Instagram or TikTok, those services handle the conversation under their own policies.',
          "Want it all gone? Remove the cakes from your cart, or clear this site's data in your browser settings.",
        ],
      },
      {
        text: "If the shop ever opens for real, this section will be rewritten under Vietnam's Personal Data Protection Law (in force since 1 January 2026) and its implementing rules.",
      },
    ],
  },
}

const faqItems: FaqItem[] = [
  {
    q: 'Is the shop real?',
    a: "Nope. Kai's Bakery is a web project by Kai, built to show off 3D graphics and what a proper cake shop site looks like. Cakes, prices and orders are all for show, and nobody gets charged.",
    link: { href: '/about#project', label: 'Read about the project' },
  },
  {
    q: 'Can I order for today?',
    a: 'Yes for menu cakes (10–20 cm): order at least 4 hours ahead, and before 18:00 for same-day pickup. Your own designs need 24 hours, two-tier cakes 48.',
  },
  {
    q: 'How much is delivery?',
    a: 'It depends on the distance. We book Grab, Be or Ahamove and tell you the app fee before booking; you pay the driver or add it to your transfer. Delivery runs 8:00–21:30 across the old inner districts of Ho Chi Minh City.',
  },
  {
    q: 'How sweet is "less sweet"?',
    a: 'Sweet enough that the second slice still hits, never cloying. Sweet tooth? Pick "Regular sweet" while designing, no extra charge.',
  },
  {
    q: 'What cream do you use?',
    a: 'Cream-cheese whipped cream: whipping cream beaten with cream cheese. Milky, light, holds up in the heat, and no vegetable cream, ever.',
  },
  {
    q: 'I have allergies. What should I know?',
    a: 'Every cake has egg, milk and wheat. Chocolate has soy; macarons and pistachio have tree nuts. The design page lists "Contains: …" for each cake. Our kitchen shares tools with nuts, so text Kai first if your allergy is serious.',
    link: { href: '/policies#allergens', label: 'See ingredients and allergens' },
  },
  {
    q: 'How long does a cake keep?',
    a: "Best within 24 hours, finish it within 48, kept in the fridge at 2–6°C. Take it out 15–20 minutes before cutting, and don't leave it out for more than an hour.",
  },
  {
    q: 'Does writing on the cake cost extra?',
    a: 'Free! Up to 22 characters, Vietnamese accents included. Candles, knife and plates come free too.',
  },
  {
    q: 'Can you copy a cake from a photo?',
    a: "Yes. Send the photo on Zalo, order at least 48 hours ahead, with a 50% deposit. We'll quote you and be honest about what we can and can't pull off.",
  },
  {
    q: 'When do I need a deposit?',
    a: 'Photo designs, two-tier cakes, orders from 1,000,000 VND and holiday orders: 50% by bank transfer or MoMo, the rest when you get the cake.',
  },
  {
    q: 'What if I need to cancel?',
    a: "Tell us 24 hours ahead: free, with 100% of the deposit back. Later than that, if we've already started baking, we keep the deposit to cover ingredients.",
    link: { href: '/policies#changes', label: 'See the cancellation policy' },
  },
  {
    q: 'Can I get a VAT invoice?',
    a: "Not yet. The shop isn't real, so there's no tax code and no invoice. If it ever opens for real, it will register as a business and issue proper invoices.",
  },
  {
    q: 'How do I send my design to the shop?',
    a: "The design page has a button to send your design: it gives you a link holding your exact cake. Paste it into Zalo and you're done, no need to describe every layer.",
    link: { href: '/design', label: 'Design your cake' },
  },
]

export const pages: PagesDict = {
  about: {
    meta: {
      title: 'About',
      description: "Who Kai's Bakery is, how the cakes are made, opening hours and where to text us.",
    },
    eyebrow: 'About the shop',
    title: 'Hey there, ',
    accent: "I'm Kai.",
    lead: 'A tiny (imaginary) cake shop in the Thủ Đức area, obsessed with fresh cream, cute cakes and building websites.',
    story: {
      title: 'Our story',
      paragraphs: [
        "Kai started baking back in uni, because friends' birthday cakes from the shops were way too sweet. That became the house rules: less sweet by default, cream-cheese whipped cream, and free lettering on every cake.",
        'The shop bakes for students around the University Village, office folks on the east side, and parents ordering for their kids. A bento for your bestie, the classic 16 cm for the whole office, two tiers for the days you need main character energy.',
        "What makes Kai's different: you see your cake in 3D before you order, every choice changes it, and the price updates instantly. No more DMing back and forth just to ask how much.",
      ],
    },
    rules: {
      title: 'House rules',
      items: [
        { icon: 'cake', text: 'Less sweet by default' },
        { icon: 'cream', text: 'Cream-cheese whipped cream, no vegetable cream' },
        { icon: 'pen', text: 'Lettering, candles, knife and plates: all free' },
      ],
    },
    project: {
      title: 'Real talk: ',
      accent: "this shop isn't real.",
      body: "Kai's Bakery is a web project by Kai. There is no shop, no kitchen, and nobody takes orders. The cakes, prices and policies are written the way a real shop would write them, so the site gets a proper workout, but no order is ever sent and nobody gets charged.",
      showsTitle: 'What the project shows',
      shows: [
        'Real-time 3D cakes built entirely from code, changing with every choice, sliceable to see each layer.',
        '"Studio photo" pictures path-traced right in the browser.',
        'Vietnamese and English, Vietnamese by default, with a separate address for each language.',
        'Works with a keyboard and a screen reader, has a reduced-motion mode and 2D drawings when WebGL is missing.',
        'Smooth on low-end devices too: quality steps down when the frame rate drops.',
        'Smooth motion: the cake eases into every choice, toppings drop on, pages and color sets cross-fade.',
      ],
      stackLabel: 'Built with',
      stack: [
        'Next.js 16',
        'React 19',
        'TypeScript',
        'three.js',
        'React Three Fiber',
        'drei',
        'postprocessing',
        'three-gpu-pathtracer',
        'Tailwind CSS 4',
        'zustand',
        'Lenis',
      ],
      maker: "See Kai's other projects",
      source: 'See the source code on GitHub',
    },
    hours: {
      title: 'Opening hours',
      shop: 'At the shop',
      delivery: 'Delivery',
      everyDay: 'every day',
      area: 'Location',
    },
    areas: {
      title: 'Where we deliver',
      lead: "Across Ho Chi Minh City's old inner districts by Grab, Be or Ahamove. The delivery fee is whatever the app charges, and you pay it.",
      merger:
        "Since 1 July 2025, Ho Chi Minh City has no districts and has merged with Bình Dương and Bà Rịa – Vũng Tàu. We still list the old district names because everyone knows them, and we don't deliver to the newly merged provinces yet.",
    },
    contact: {
      title: 'Text Kai',
      note: "The shop isn't open for real, but Kai still reads every message. Questions about the project or a web gig are welcome too.",
      hotline: 'Hotline & Zalo',
    },
  },
  policies: {
    meta: {
      title: 'Policies',
      description:
        'Pickup and delivery, payment and deposits, canceling or changing an order, damaged cakes, storage and allergens, personal data.',
    },
    eyebrow: 'Policies',
    title: 'The stuff to know ',
    accent: 'before you order.',
    lead: 'Short and straight: timing, money, cancellations, and what happens if a cake gets damaged. Read it, then order with zero stress.',
    demoNote:
      "These are sample policies for a shop that doesn't exist, written exactly as a real shop would. You can't order a real cake here.",
    tocLabel: 'On this page',
    allergenHint: 'The design page and the cart always list "Contains: …" for every cake.',
    sections: policySections,
  },
  faq: {
    meta: {
      title: 'FAQ',
      description:
        'Can I order same-day, how much is delivery, how sweet is "less sweet"… all your questions in one place.',
    },
    eyebrow: 'FAQ',
    title: 'Ask away, ',
    accent: "we've got answers.",
    lead: 'The questions people ask most, answered short and straight.',
    items: faqItems,
    more: {
      title: "Didn't find your question?",
      body: 'Send Kai a message and you will get an answer fast (during waking hours).',
      hotline: 'Hotline & Zalo',
    },
  },
}
