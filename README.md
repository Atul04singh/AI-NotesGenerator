---
# 📘 AI Notes Generator (Microservices Architecture)

A modular **Notes Generator System** built with **Node.js microservices**, designed to automatically generate structured study notes from a given syllabus.  
This project follows a **microservices architecture**, making it scalable, maintainable, and easy to extend with new features.

---

## 🚀 Features
- 📝 **Content Service** → Generates detailed notes from syllabus topics.  
- 🖼 **Image Parser Service** → Extracts text from images and converts it into notes.  
- 📂 **Index Service** → Handles indexing and searching of generated notes.  
- 🧠 **Orchestrator** → Coordinates all services to work together smoothly.  
- 💻 **App UI** → Simple frontend to interact with the system.  
- ⚡ **PM2 Support** → Manage all services with one command using `ecosystem.config.js`.  

---

## 🏗 Project Structure
```
notes-generator/
│── services/
│   ├── app-ui/              # Frontend UI
│   ├── content-service/     # Generates notes from syllabus
│   ├── img-parser-service/  # Parses images into text
│   ├── index-service/       # Indexing & search
│   └── orchestrator/        # Coordinates services
│
├── ecosystem.config.js      # PM2 process manager config
├── package.json             # Root (for npm workspaces or global deps)
└── README.md                # Documentation
```

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Atul04singh/notes-generator.git
cd notes-generator
```

### 2️⃣ Install Dependencies
Each service has its own dependencies. Install them individually:
```bash
cd services/content-service && npm install
cd ../img-parser-service && npm install
cd ../index-service && npm install
cd ../orchestrator && npm install
cd ../app-ui && npm install
```

### 3️⃣ Environment Variables
Each service uses its own `.env` file.  
Example for **content-service/.env**:
```
MONGO_URI=mongodb://localhost:27017/notes
PORT=3001
```

### 4️⃣ Running Services

#### Option A: Run manually
```bash
cd services/content-service && node app.js
cd services/img-parser-service && node app.js
cd services/index-service && node app.js
cd services/orchestrator && node app.js
cd services/app-ui && npm start
```

#### Option B: Run all with PM2
```bash
pm2 start ecosystem.config.js
```

---

## 🧩 How It Works
1. User uploads a **syllabus or image** through the **App UI**.  
2. **Orchestrator** coordinates between services.  
3. **Content Service** generates structured notes.  
4. **Image Parser Service** converts diagrams/images into text.  
5. **Index Service** indexes all notes for fast retrieval.  
6. Final structured notes are stored in **MongoDB** and served via UI.  

---

## 🛠 Tech Stack
- **Backend:** Node.js, Express  
- **Frontend:** React / Plain UI (app-ui)  
- **Database:** MongoDB  
- **Process Manager:** PM2  
- **Architecture:** Microservices  

---
## Output
### 📄 Cloud Computing Notes
[View PDF](https://github.com/Atul04singh/AI-NotesGenerator/blob/main/opt/Cloud%20Computing%20notes%20by%20Atul%20Singh%20(llama).pdf)

- This notes generator is most sutaible for 60% theory and 40% derivation , best for programing notes.
- its output also depends on which ollama llm model you are using . 

---

## 📌 Future Enhancements
- ✨ Add AI-powered **summarization** of notes.
- 🖼️ get img of important concept (through web scraper or ai img generation) 
- 📊 Interactive **charts & diagrams** generation.  
- 🔍 Advanced **search and filtering** of notes.  
- ☁️ Cloud deployment with Docker & Kubernetes.  

---

## 👨‍💻 Author
Developed by **Atul Singh** 💡  
