# 🚴 Cycle Momentum Tracker

Turn daily collaborative effort into a shared, high-energy visual journey. Instead of tracking work through dry status checklists, this tool turns team activity into physical momentum, like an electric bicycle riding across an evolving landscape fueled by every contribution.

---

## 🔗 Live Links

* **🚀 Production App & Admin Portal**: [https://cycle-momentum-tracker.vercel.app/](https://cycle-momentum-tracker.vercel.app/)
* **⚡ Live Interactive Demo (100 Sample Pushes Across 10 Members)**: [Link](https://cycle-momentum-tracker.vercel.app/index.html?org=00000000-0000-0000-0000-000000000001)

---

## 📸 Demo Preview
<img width="660" height="406" alt="testdemo" src="https://github.com/user-attachments/assets/8006360d-8b31-4c01-8be5-0b0358c8dfc7" />

Bicycle Momentum Tracker Demo

---

## 🎯 The Core Concept

Progress is often difficult to feel in real time. Work happens in bursts fixing a tricky bug, polishing a design, shipping an update, or unblocking a teammate but individual contributions often stay isolated.

The aim of this project is to **make collective velocity tangible and energizing**:
* The bicycle does not move on its own; it relies entirely on team energy.
* Every logged win acts as a direct **"push"** that accelerates the bicycle forward.
* Contributions weave into an expanding, multi-colored electric thrust trail across the landscape.
* It shifts the focus from rigid task surveillance to celebrating **forward motion, team presence, and continuous momentum**.

---

## 🛠️ Key Features & Capabilities

**Admin Portal & Team Management (`admin.html`)**
* **Secure Authentication**: Dedicated admin login and registration system.
* **Workspace & Organization Setup**: Create and manage multiple organizations from a single dashboard.
* **Bicycle Theme Customization**: Choose between standard preset themes (Classic Red, Electric Blue) or inject raw **Custom SVG code** to completely alter the vehicle geometry.
* **Team Roster Management**: Add team members, assign individual PINs for authentication, and customize unique high-contrast color codes per member.
* **Shareable Workspace Links**: Instant generation of unique team board URLs (`index.html?org=<ID>`) for direct member access.
* **Full Data Control**: Edit existing member credentials, modify organization settings, or cleanly delete organizations and accounts.

**Team Member Experience & Live Board (`index.html`)**
* **Fast PIN-Based Pushing**: Team members select their name, enter their short PIN, and optionally attach a note about what they achieved.
* **Dynamic Multi-Colored Thrust Trails**: Each push injects that member's unique color code into an evolving lightning/thrust cone behind the rear hub.
* **Parallax World Movement**: Ground layers, rivers, forests, and distant mountains scroll at varied speeds proportional to cumulative team pushes.
* **Interactive Time-Lapse Player**: Full timeline scrub and replay controls (`⏮ Start`, `▶ Play / ⏸ Pause`, `⏭ Current`) with adjustable playback speeds (`0.5x` to `10x Hyper`) to watch the entire sprint unfold from step zero to the latest push.

---

## 🔮 Upcoming Features & Ideas

* **Momentum Decay & Wobble Dynamics**: Introduce dynamic slowing if pushes become infrequent over time, with a playful wobble or fall-over state to signal when a team needs a boost.
* **Office Kiosk & Ambient Display Mode**: A distraction-free full-screen display mode designed for shared TV monitors and break-room tablets.
* **Beyond Bicycles**: Expanding the procedural SVG engine to support rockets, spaceships, trains, or custom studio mascots.

---

## 🏗️ Architecture & Security

* **Frontend**: Vanilla JavaScript (ES6+), responsive HTML5, procedural vector math using SVG bounding box calibration.
* **Backend Proxy**: Vercel Serverless Functions (`/api/tracker.js`, `/api/admin.js`) isolating all database calls and keeping sensitive keys hidden from the browser.
* **Database & Auth**: Supabase PostgreSQL with server-side PIN and password verification.
* **Hosting**: Vercel with automated continuous deployment via GitHub.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Credits & Attribution

* **Concept, Architecture & Design Direction**: Conceived, architected, and directed by **Yash Thummar / YashT-7**.
* **AI Coding Partner**: Developed with the assistance of **Gemini (Google AI)** for code generation, SVG vector geometry calculations, and serverless proxy structuring.

If you use or adapt this project, please provide attribution by linking back to this repository!
