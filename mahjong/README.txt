mahjong-ai-backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   └ settings.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── news.py
│   │   ├── post.py
│   │   ├── practice.py
│   │   └── achievement.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── news.py
│   │   ├── post.py
│   │   └── practice.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── news.py
│   │   │   ├── community.py
│   │   │   ├── practice.py
│   │   │   └── admin.py
│   │   └── dependencies.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py
│   │   ├── auth.py
│   │   └── mahjong_ai.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── news_service.py
│   │   ├── post_service.py
│   │   └── practice_service.py
│   └── utils/
│       ├── __init__.py
│       ├── database.py
│       ├── validators.py
│       └── helpers.py
├── requirements.txt
├── Dockerfile
└── .env