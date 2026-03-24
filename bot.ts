import { Bot, Context, session, type SessionFlavor } from "grammy";
import { I18n, type I18nFlavor } from "@grammyjs/i18n";
import { fromFileUrl } from "@std/path";
import { lang } from "./data/languages.ts";
import { country } from "./data/country.ts";
import { User } from "./user.ts";
import { log } from "node:console";
import { getASIN, setAmazonDomain } from "./api/rainforest.ts";

interface SessionData {
  __language_code?: string;
}
type MyContext = Context & SessionFlavor<SessionData> & I18nFlavor;

const bot = new Bot<MyContext>("8705539363:AAGClO-WlpTlq02XMjIJ6CU-3vD40zVcAfY");

bot.use(session({ initial: () => ({}) }));

const localesPath = fromFileUrl(new URL("./locales", import.meta.url));

const i18n = new I18n<MyContext>({
  defaultLocale: "en",
  directory: localesPath,
  useSession: true,
});

let user : User;

bot.use(i18n);

bot.command("start", async (ctx) => {
  user = new User(ctx.from?.first_name || "User");
  await ctx.reply(ctx.t("welcome") + " " + user.name + "!");
  await ctx.reply(ctx.t("ask_lang"), {
    reply_markup: {
      inline_keyboard: Object.entries(lang).map(([key, langData]) => [
        {
          text: langData[`${key}_txt` as keyof typeof langData],
          callback_data: langData.callback_data,
        },
      ]),
    },
  });
});

bot.command("track", (ctx) => {
  if (!user.location) {
    replyWithLocation(ctx, ctx.t("ask_location_first"));
    return;
  }
  ctx.reply(ctx.t("product_input"), {
    reply_markup: {
      force_reply: true,
    },
  })
});

bot.on("message:text", async (ctx) => {
  const isReplyToBot = ctx.message.reply_to_message?.from?.id === ctx.me.id;
  
  if (!isReplyToBot) {
    return;
  }

  const text = ctx.message.text;
  const asin = getASIN(text);

  if (asin) {
    log("ASIN estratto:", asin);
    await ctx.reply(ctx.t("product_added"));
  } else {
    await ctx.reply("Per favore, invia un link Amazon valido in risposta al messaggio.");
  }
});

// Handle the callback query when the user selects a language
bot.callbackQuery(/set_(.+)/, async (ctx) => {
  const newLang = ctx.match[1];
  await ctx.i18n.setLocale(newLang);
  await ctx.answerCallbackQuery();
  await ctx.reply(ctx.t("language_set"));
  user.language = newLang;
  replyWithLocation(ctx, ctx.t("ask_location"));
});

bot.callbackQuery(/reg_(.+)/, (ctx) => {
  const selectedCountry = ctx.match[1];
  user.location = selectedCountry;
  setAmazonDomain(country[selectedCountry as keyof typeof country].amazon_domain);
});

async function replyWithLocation(ctx: MyContext, text: string = ctx.t("ask_location")) {
  await ctx.reply(text, {
    reply_markup: {
      inline_keyboard: Object.entries(country).map(([key, countryData]) => [
        {
          text: String(countryData[`${key}_txt` as keyof typeof countryData]),
          callback_data: countryData.callback_data,
        },
      ]),
    },
  });
}



bot.start();