import asyncio
import aiohttp
import logging
from datetime import datetime
import pytz

from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import CommandStart
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties

from apscheduler.schedulers.asyncio import AsyncIOScheduler

# ================= НАЛАШТУВАННЯ =================
# ВСТАВТЕ НОВИЙ ТОКЕН, ЯКИЙ ВИДАСТЬ BOTFATHER ПІСЛЯ /revoke
BOT_TOKEN = "8644240070:AAGSuoSgppI-LpvB2r5oX3xsymr-N6bWgNw"

# Ваш токен з кабінету AdsGram (у профілі праворуч вгорі)
ADSGRAM_TOKEN = "ab5d3577509a4e248cf5b1a52f1c5869"

# Ваш Block ID (числа без префіксів, наприклад 59907)
ADSGRAM_BLOCK_ID = "59907" 

# Список промокодів, які додаються до реклами
PROMO_CODES = ["ads", "ads+", "freecoins"]

# ================= ІНІЦІАЛІЗАЦІЯ =================
bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()

# Тимчасова база користувачів (для тестів)
user_ids = set()

# ================= ОБРОБНИКИ =================
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    user_ids.add(message.from_user.id)
    await message.answer("Привіт! Я надсилатиму рекламу кожні 14 годин. Очікуй!")

# ================= ФУНКЦІЇ ADSGRAM =================
async def get_adsgram_ad(user_id):
    url = f"https://api.adsgram.ai/advbot?tgid={user_id}&blockid={ADSGRAM_BLOCK_ID}&language=uk&token={ADSGRAM_TOKEN}"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                return None
            return await response.json()

# ================= РОЗСИЛКА =================
async def send_ad_broadcast():
    logging.info(f"Початок розсилки реклами о {datetime.now(pytz.timezone('Europe/Kyiv'))}")
    
    for user_id in list(user_ids):
        try:
            ad_data = await get_adsgram_ad(user_id)
            
            if ad_data:
                keyboard = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text=ad_data.get("button_name", "Перейти"), url=ad_data.get("click_url"))],
                    [InlineKeyboardButton(text=ad_data.get("button_reward_name", "Отримати нагороду"), url=ad_data.get("reward_url"))]
                ])
                
                promo_text = "\n\n🎁 <b>Промокоди:</b> " + " | ".join([f"<code>{code}</code>" for code in PROMO_CODES])
                full_caption = ad_data.get("text_html", "") + promo_text
                
                await bot.send_photo(
                    chat_id=user_id,
                    photo=ad_data.get("image_url"),
                    caption=full_caption,
                    parse_mode=ParseMode.HTML,
                    reply_markup=keyboard,
                    protect_content=True
                )
            else:
                logging.warning(f"Реклама для {user_id} не завантажилась")
        except Exception as e:
            logging.error(f"Помилка надсилання для {user_id}: {e}")
        
        await asyncio.sleep(0.5)

# ================= ЗАПУСК =================
async def main():
    logging.basicConfig(level=logging.INFO)
    
    scheduler = AsyncIOScheduler(timezone=pytz.timezone('Europe/Kyiv'))
    scheduler.add_job(send_ad_broadcast, 'interval', hours=22)
    scheduler.start()
    
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
