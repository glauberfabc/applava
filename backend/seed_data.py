import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if admin already exists
    admin_exists = await db.users.find_one({"email": "admin@estetica.com"})
    
    if not admin_exists:
        # Create admin user
        admin = {
            "email": "admin@estetica.com",
            "password": pwd_context.hash("admin123"),
            "name": "Administrador",
            "role": "admin"
        }
        await db.users.insert_one(admin)
        print("✅ Admin user created: admin@estetica.com / admin123")
    else:
        print("ℹ️  Admin user already exists")
    
    # Check if collaborator exists
    collab_exists = await db.users.find_one({"email": "colaborador@estetica.com"})
    
    if not collab_exists:
        # Create collaborator user
        collaborator = {
            "email": "colaborador@estetica.com",
            "password": pwd_context.hash("collab123"),
            "name": "Colaborador Teste",
            "role": "collaborator"
        }
        await db.users.insert_one(collaborator)
        print("✅ Collaborator user created: colaborador@estetica.com / collab123")
    else:
        print("ℹ️  Collaborator user already exists")
    
    # Check if services exist
    services_count = await db.services.count_documents({})
    
    if services_count == 0:
        # Create default services
        services = [
            {
                "name": "Lavagem Simples",
                "price": 50.00,
                "estimated_duration": 30,
                "description": "Lavagem externa completa",
                "active": True
            },
            {
                "name": "Lavagem Completa",
                "price": 80.00,
                "estimated_duration": 60,
                "description": "Lavagem externa e interna",
                "active": True
            },
            {
                "name": "Polimento",
                "price": 200.00,
                "estimated_duration": 120,
                "description": "Polimento e cristalização de pintura",
                "active": True
            },
            {
                "name": "Enceramento",
                "price": 100.00,
                "estimated_duration": 45,
                "description": "Aplicação de cera protetora",
                "active": True
            },
            {
                "name": "Higienização Interna",
                "price": 120.00,
                "estimated_duration": 90,
                "description": "Limpeza profunda do interior",
                "active": True
            },
            {
                "name": "Vitrificação",
                "price": 500.00,
                "estimated_duration": 180,
                "description": "Proteção de pintura com vitrificação",
                "active": True
            }
        ]
        await db.services.insert_many(services)
        print(f"✅ {len(services)} services created")
    else:
        print(f"ℹ️  {services_count} services already exist")
    
    client.close()
    print("\n✅ Database seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_database())
