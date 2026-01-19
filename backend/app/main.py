from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .auth.routes import router as auth_router
from .admin.routes import router as admin_router
from .prof.routes import router as prof_router
from .student.routes import router as student_router
from .chat.routes import router as chat_router
from .complaint.routes import router as complaint_router
from .calendar.routes import router as calendar_router
from .groups.routes import router as groups_router
from .utils.daily_message_calculator import calculate_daily_message_counts


app = FastAPI()

# Set up scheduler for daily message calculation
scheduler = AsyncIOScheduler()
scheduler.add_job(calculate_daily_message_counts, 'cron', hour=1)  # Run daily at 1 AM
scheduler.start()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(prof_router)
app.include_router(student_router, prefix="/student", tags=["student"])
app.include_router(chat_router)
app.include_router(complaint_router)
app.include_router(calendar_router)
app.include_router(groups_router)
