# Project Setup Guide

## Prerequisites
- Node.js (v18+) & npm
- Python (3.10+) & pip

## Step 1: Clone
```bash
git clone https://github.com/yadrikshauprety/netwon1.git
cd netwon1
```

## Step 2: Frontend

```bash
cd Frontend
```

Copy `.env.example` to `.env` and fill in the values (ask your team lead for keys).

Then install and run:
```bash
npm install
npm run dev
```

Frontend runs at **http://localhost:8080**

## Step 3: Backend (new terminal)

```bash
cd Backend
```

Copy `.env.example` to `.env` and fill in the values.

Then install and run:
```bash
pip install -r requirements.txt
python main.py
```

Backend runs at **http://localhost:5000**

## Quick Check
- Open http://localhost:8080 in your browser
- Backend health check: http://localhost:5000/health should return `{"status":"ok"}`
