import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Process = {
  id: number;
  title: string;
  description: string;
  steps: number;
  category: string;
  flow: string[];
  owner: string;
  customWorkflow?: boolean;
  svgPath: string;
};

type NodeKind =
  | "start"
  | "task"
  | "system"
  | "approval"
  | "decision"
  | "document"
  | "end";

type FlowNode = {
  id: string;
  title: string;
  kind: NodeKind;
  x: number;
  y: number;
  department: string;
  owner: string;
  description: string;
  inputs: string;
  actions: string;
  output: string;
  condition: string;
  next: string;
  details?: string[];
};

const toPersianNumber = (value: number | string) =>
  String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

const categories = [
  {
    id: "01",
    title: "فاز اول ",
    subtitle: "step1",
    description: "ورود به سامانه مدیریت فرآیندهای تأمین",
    accent: "#172B4D",
  },
  {
    id: "02",
    title: "فاز دوم",
    subtitle: "PROCUREMENT & PURCHASING",
    description: "از نیازسنجی تا انتخاب پیشنهاد برتر",
    accent: "#172B4D",
  },
  {
    id: "03",
    title: "فاز سوم",
    subtitle: "PROCUREMENT COMMISSION",
    description: "بررسی، تصمیم‌گیری و تصویب معاملات",
    accent: "#172B4D",
  },
  {
    id: "04",
    title: "فاز چهارم",
    subtitle: "CONTRACTS & DELIVERY",
    description: "تعهدات، دریافت و پایش عملکرد",
    accent: "#172B4D",
  },
];

const processSeeds: Omit<Process, "id" | "category" | "svgPath">[] = [
  {
    title: "ورود تامین کننده",
    description: "ورود مجدد، فراموش رمز کاربر حقیقی و حقوقی",
    steps: 8,
    owner: "تامین کننده",
    flow: [
      "تعریف نیاز تأمین",
      "شناسایی تأمین‌کننده",
      "بررسی اطلاعات پایه",
      "طبقه‌بندی و بخش‌بندی",
      "تعیین راهبرد تعامل",
      "پایش وضعیت همکاری",
    ],
  },
  {
    title: "ثبت‌نام تأمین‌کننده",
    description: "استعلام گیری و ثبت نام تامین کنندگان ",
    steps: 9,
    owner: "امور تأمین‌کنندگان",
    flow: [
      "ارسال دعوت‌نامه ثبت‌نام",
      "تکمیل اطلاعات هویتی",
      "بارگذاری اسناد قانونی",
      "کنترل کامل بودن مدارک",
      "اصلاح نواقص احتمالی",
      "ایجاد شناسه تأمین‌کننده",
    ],
  },
  {
    title: "ارزیابی تأمین‌کنندگان",
    description: "ارزیابی تامین کننده حقیقی و حقوقی",
    steps: 11,
    owner: "کمیته ارزیابی",
    flow: [
      "دریافت درخواست ارزیابی",
      "کنترل پیش‌شرط‌ها",
      "ارزیابی فنی و کیفی",
      "ارزیابی مالی و حقوقی",
      "محاسبه امتیاز نهایی",
      "تصویب سطح صلاحیت",
    ],
  },
  // ✅ مرحله‌ی جدید فاز اول
  {
    title: "تمیز کردن BP ها",
    description: "پاکسازی و یکپارچه‌سازی اطلاعات پایه شرکای تجاری",
    steps: 6,
    owner: "امور تأمین‌کنندگان",
    flow: [
      "استخراج فهرست BP ها",
      "شناسایی رکوردهای تکراری",
      "کنترل صحت اطلاعات هویتی",
      "ادغام یا حذف رکوردهای نامعتبر",
      "اصلاح اطلاعات ناقص",
      "تأیید نهایی و ثبت تغییرات",
    ],
  },
  {
    title: "درخواست خرید",
    description: "ثبت و هدایت نیاز خریدهای هلدینگ",
    steps: 8,
    owner: "کارشناس خرید",
    flow: [
      "تعریف نیاز خرید",
      "تکمیل مشخصات فنی",
      "برآورد مقدار و زمان",
      "کنترل مرکز هزینه",
      "تأیید مدیر واحد",
      "ثبت درخواست رسمی",
    ],
  },
  {
    title: "کارتابل ادمین",
    description: "دسترسی های ادمین ",
    steps: 9,
    owner: "ادمین SRM",
    flow: [
      "دریافت درخواست خرید",
      "کنترل اطلاعات اولیه",
      "بررسی ضرورت خرید",
      "کنترل بودجه مصوب",
      "اخذ تأیید صاحب بودجه",
      "ارسال به بازرگانی",
    ],
  },
  {
    title: "کارتابل اعضا کمسیون",
    description: "تایید کمسیون و مشاهده پیشنهاد ها",
    steps: 14,
    owner: "مدیریت بازرگانی",
    flow: [
      "دریافت درخواست مصوب",
      "تعیین روش خرید",
      "شناسایی منابع تأمین",
      "دریافت پیشنهادها",
      "ارزیابی فنی و مالی",
      "بررسی نصاب معامله",
      "تشکیل کمیسیون معاملات",
      "تصمیم و تصویب خرید",
      "صدور سفارش خرید",
    ],
  },
  {
    title: "کارتابل مدیر بازرگانی",
    description: "کارتابل مدیر همراه با مجووز های مدیر بازرگانی",
    steps: 8,
    owner: "هوش مصنوعی",
    flow: [
      "تدوین اسناد استعلام",
      "انتخاب فهرست تأمین‌کنندگان",
      "ارسال هم‌زمان استعلام",
      "ثبت پرسش و پاسخ",
      "دریافت پاکت پیشنهاد",
      "بستن مهلت استعلام",
    ],
  },
  {
    title: "هوش مصنوعی کمکی",
    description: "انتخاب پیشنهاد برتر ",
    steps: 10,
    owner: "کمیته ارزیابی پیشنهاد",
    flow: [
      "ثبت پیشنهادهای واصله",
      "کنترل مهلت ارسال",
      "گشایش پیشنهادها",
      "کنترل انطباق فنی",
      "مقایسه تجاری و مالی",
      "رتبه‌بندی پیشنهادها",
    ],
  },
  {
    title: "تشکیل کمیسیون معاملات",
    description: "ایجاد جلسه و تعیین ترکیب رسمی کمیسیون",
    steps: 8,
    owner: "دبیرخانه کمیسیون",
    flow: [
      "دریافت پرونده معامله",
      "کنترل نصاب و روش",
      "پیشنهاد زمان جلسه",
      "تعیین اعضای کمیسیون",
      "اخذ تأیید رئیس",
      "تشکیل جلسه رسمی",
    ],
  },
  {
    title: "کارتابل مدیر بازرگانی",
    description:
      "مدیریت پیشنهادها، ارزیابی کمیسیون و تصمیم‌گیری نهایی معاملات",
    steps: 68,
    owner: "مدیر بازرگانی",
    customWorkflow: true,
    flow: [
      "دریافت پیشنهادها و اطلاعات کمیسیون",
      "دریافت اطلاعات تأمین‌کنندگان",
      "دریافت مبالغ پیشنهادی",
      "دریافت هزینه‌های حمل",
      "دریافت زمان‌بندی تحویل",
      "دریافت مشخصات فنی و کیفیت",
      "دریافت شرایط پرداخت",
      "دریافت مستندات و پیوست‌ها",
      "تشکیل پرونده الکترونیکی",
      "ثبت زمان ورود پرونده",
      "نمایش پرونده در کارتابل مدیر",
      "نمایش فهرست کمیسیون‌ها",
      "جست‌وجوی پرونده",
      "فیلتر بر اساس گروه کالا",
      "فیلتر بر اساس مبلغ پیشنهادی",
      "فیلتر بر اساس هزینه حمل",
      "فیلتر بر اساس زمان تحویل",
      "فیلتر بر اساس کیفیت و مشخصات فنی",
      "فیلتر بر اساس شرایط پرداخت",
      "فیلتر بر اساس اعتبار تأمین‌کننده",
      "مقایسه پیشنهادهای دریافتی",
      "بررسی سوابق تأمین‌کنندگان",
      "تحلیل و امتیازدهی سیستمی",
      "رتبه‌بندی پیشنهادها",
      "نمایش پیشنهادهای برتر",
      "مشاهده رتبه‌بندی سیستم",
      "بررسی جزئیات پیشنهادهای برتر",
      "انتخاب پیشنهادهای موردنظر مدیر",
      "ثبت نظر و توضیحات مدیر",
      "علامت‌گذاری پیشنهاد منتخب با ستاره",
      "تأیید فهرست پیشنهادهای منتخب",
      "ثبت زمان ارسال",
      "ارسال پیشنهادها به اعضای کمیسیون",
      "ایجاد وظیفه مستقل برای هر عضو",
      "ارسال اعلان به اعضای کمیسیون",
      "دریافت تصمیم اعضا",
      "کنترل تکمیل بررسی اعضا",
      "بررسی پیشنهادهای منتخب مدیر توسط اعضا",
      "مشاهده مستندات و مقایسه پیشنهادها",
      "ثبت تأیید و امضای عضو",
      "ثبت رد پیشنهاد توسط عضو",
      "انتخاب پیشنهاد موردنظر عضو",
      "ثبت توضیحات و دلایل تصمیم",
      "ثبت زمان و سابقه تصمیم",
      "کنترل وضعیت بررسی اعضا",
      "انتظار برای تکمیل بررسی همه اعضا",
      "تجمیع نتایج تصمیم اعضا",
      "ارسال نتایج به کارتابل مدیر",
      "نمایش اعضای تأییدکننده و امضاکننده",
      "نمایش اعضای مخالف و پیشنهادهای ردشده",
      "نمایش انتخاب هر عضو",
      "نمایش پیشنهاد منتخب اولیه مدیر",
      "نمایش اختلاف‌نظر اعضا",
      "نمایش توضیحات و سوابق تصمیمات",
      "مقایسه نتایج اعضا با پیشنهاد مدیر",
      "بررسی نهایی پرونده توسط مدیر",
      "تصمیم نهایی مدیر بازرگانی",
      "تعیین تأمین‌کننده یا تأمین‌کنندگان برنده",
      "ثبت مبلغ نهایی و شرایط مورد تأیید",
      "ثبت تأیید نهایی مدیر",
      "ثبت سوابق و مستندات کمیسیون",
      "ارسال نتیجه به مرحله بعد فرآیند خرید",
      "ثبت دلیل عودت برای بررسی مجدد",
      "ارجاع مجدد به اعضای کمیسیون",
      "ایجاد دور جدید بررسی",
      "حفظ سوابق دور قبلی",
      "ثبت علت رد نهایی",
      "تعیین وضعیت نهایی پرونده",
      "بستن پرونده",
      "پایان فرآیند",
    ],
  },
  {
    title: "کارتابل اعضای کمیسیون",
    description: "مدیریت وظایف، اسناد و اعلام نظر اعضا",
    steps: 8,
    owner: "اعضای کمیسیون",
    flow: [
      "دریافت اعلان پرونده",
      "مشاهده دستور جلسه",
      "مطالعه اسناد معامله",
      "ثبت پرسش یا ابهام",
      "اعلام آمادگی بررسی",
      "ارسال نظر کارشناسی",
    ],
  },
  {
    title: "بررسی، رأی‌گیری و تصویب معاملات",
    description: "بررسی جمعی، ثبت آرا و ابلاغ تصمیم نهایی",
    steps: 10,
    owner: "رئیس کمیسیون",
    flow: [
      "احراز رسمیت جلسه",
      "ارائه گزارش کارشناسی",
      "بررسی پیشنهادها",
      "رفع تعارض منافع",
      "ثبت رأی اعضا",
      "جمع‌بندی و تصویب",
    ],
  },
  {
    title: "تیکتینگ",
    description: "پشتیبانی برای تامین کنندگان",
    steps: 8,
    owner: "واحد سفارشات",
    flow: [
      "دریافت مجوز خرید",
      "تطبیق پیشنهاد منتخب",
      "تنظیم اقلام سفارش",
      "کنترل شرایط تجاری",
      "اخذ امضاهای مجاز",
      "ابلاغ سفارش خرید",
    ],
  },
  {
    title: "نظرسنجی",
    description: "مراحل ثبت نظر تامین کنندگان",
    steps: 12,
    owner: "",
    flow: [
      "دریافت مصوبه معامله",
      "تدوین پیش‌نویس قرارداد",
      "کنترل حقوقی",
      "مذاکره شرایط",
      "اخذ تضامین",
      "امضای طرفین",
      "پایش تعهدات",
    ],
  },
];

// نام فایل SVG هر فرآیند داخل public/flows
// کلید = شماره فرآیند (۱ = اولین کارت)؛ اگر فرآیندی اینجا نبود، process-<شماره>.svg لود می‌شود
const flowFiles: Record<number, string> = {
  1: "login.svg", // ورود تامین کننده
  2: "register.svg", // ثبت‌نام و تشکیل پرونده تأمین‌کننده
  3: "page.svg", // ارزیابی و تأیید صلاحیت تأمین‌کنندگان
  4: "bp.svg", // ✅ تمیز کردن BP ها (جدید)
  5: "procurement.svg", // درخواست خرید
  6: "admin.svg", // بررسی و تأیید درخواست خرید
  7: "COMISSION.svg", // فرآیند بازرگانی و خرید
  8: "COMMERCIAL.svg", // استعلام قیمت
  9: "Aiagent.svg", // دریافت و بررسی پیشنهادهای تأمین‌کنندگان
  10: "flow-09.svg", // تشکیل کمیسیون معاملات
  11: "flow-10.svg", // کارتابل مدیر بازرگانی
  12: "flow-11.svg", // کارتابل اعضای کمیسیون
  13: "flow-12.svg", // بررسی، رأی‌گیری و تصویب معاملات
  14: "ticket.svg", // صدور سفارش خرید
  15: "flow-14.svg", // مدیریت قراردادها
  16: "flow-15.svg", // تحویل کالا و خدمات
  17: "flow-16.svg", // بررسی و تأیید اسناد
  18: "flow-17.svg", // ارزیابی عملکرد تأمین‌کنندگان
};

const processes: Process[] = processSeeds.map((process, index) => {
  const id = index + 1;

  return {
    ...process,
    id,
    // ✅ فاز اول: ۴ آیتم اول | فاز دوم: ۵ آیتم بعدی | کمیسیون: ۴ آیتم | فاز چهارم: بقیه
    category:
      categories[index < 4 ? 0 : index < 9 ? 1 : index < 13 ? 2 : 3].title,
    svgPath: `/flows/${encodeURIComponent(flowFiles[id] ?? `process-${id}.svg`)}`,
  };
});

// فرآیندهای فاز سوم در داده‌ها حفظ شده‌اند، اما فعلاً کارت‌هایشان نمایش داده نمی‌شود.
// به‌جای آن‌ها فقط یک کارت «گزارشات» در فاز سوم نمایش داده می‌شود.
const reportsProcess: Process = {
  id: 19,
  title: "گزارشات",
  description: "دسترسی یکپارچه به گزارش‌های فرآیندهای تأمین و خرید",
  steps: 1,
  category: categories[2].title,
  flow: ["مشاهده گزارشات"],
  owner: "مدیریت سیستم",
  svgPath: `/flows/${encodeURIComponent("page.svg")}`,
};

const visibleProcesses: Process[] = [
  ...processes.filter((process) => process.id < 10 || process.id > 13),
  reportsProcess,
];

const NODE_WIDTH = 190;
const NODE_HEIGHT = 110;
const EVENT_SIZE = 88;
const DECISION_WIDTH = 180;
const DECISION_HEIGHT = 130;

function nodeWidth(node: FlowNode) {
  if (node.kind === "start" || node.kind === "end") return EVENT_SIZE;
  if (node.kind === "decision") return DECISION_WIDTH;
  return NODE_WIDTH;
}

function nodeHeight(node: FlowNode) {
  if (node.kind === "start" || node.kind === "end") return EVENT_SIZE;
  if (node.kind === "decision") return DECISION_HEIGHT;
  return NODE_HEIGHT;
}

function generateNodes(process: Process): FlowNode[] {
  const titles = process.flow;

  if (process.customWorkflow) {
    const makeNode = (
      id: string,
      title: string,
      kind: NodeKind,
      centerX: number,
      centerY: number,
      details: string[],
      department: string,
      owner: string,
      description: string,
      inputs: string,
      actions: string,
      output: string,
      condition: string,
      next: string,
    ): FlowNode => ({
      id,
      title,
      kind,
      x:
        centerX -
        (kind === "start" || kind === "end"
          ? EVENT_SIZE / 2
          : kind === "decision"
            ? DECISION_WIDTH / 2
            : NODE_WIDTH / 2),
      y: centerY,
      department,
      owner,
      description,
      inputs,
      actions,
      output,
      condition,
      next,
      details,
    });

    const groups = [
      {
        id: "intake",
        title: "دریافت و تشکیل پرونده",
        start: 0,
        end: 10,
        department: "سامانه SRM",
        owner: "سامانه و دبیرخانه",
        centerX: 1350,
        centerY: 220,
        description:
          "دریافت اطلاعات پیشنهادها و تشکیل پرونده الکترونیکی کمیسیون در کارتابل مدیر بازرگانی.",
      },
      {
        id: "filter",
        title: "فیلتر و بررسی پیشنهادها",
        start: 11,
        end: 20,
        department: "مدیریت بازرگانی",
        owner: "مدیر بازرگانی",
        centerX: 1050,
        centerY: 220,
        description:
          "جست‌وجو و اعمال فیلترهای مختلف برای بررسی و مقایسه پیشنهادهای تأمین‌کنندگان.",
      },
      {
        id: "ranking",
        title: "تحلیل و رتبه‌بندی",
        start: 21,
        end: 27,
        department: "سامانه SRM",
        owner: "سامانه و مدیر بازرگانی",
        centerX: 750,
        centerY: 220,
        description:
          "تحلیل اطلاعات، بررسی سوابق و امتیازدهی سیستمی برای مشخص شدن پیشنهادهای برتر.",
      },
      {
        id: "selection",
        title: "انتخاب مدیر و ارسال به کمیسیون",
        start: 28,
        end: 34,
        department: "مدیریت بازرگانی",
        owner: "مدیر بازرگانی",
        centerX: 450,
        centerY: 220,
        description:
          "انتخاب پیشنهادهای موردنظر، ثبت نظر مدیر و ارسال فهرست منتخب برای اعضای کمیسیون.",
      },
      {
        id: "committee",
        title: "بررسی اعضای کمیسیون",
        start: 35,
        end: 46,
        department: "کمیسیون معاملاتt",
        owner: "اعضای کمیسیون",
        centerX: 450,
        centerY: 500,
        description:
          "اعضای کمیسیون پیشنهادها و مستندات را بررسی کرده و نظر، تأیید یا رد خود را ثبت می‌کنند.",
      },
      {
        id: "aggregation",
        title: "تجمیع و نمایش نتایج",
        start: 47,
        end: 55,
        department: "سامانه SRM",
        owner: "سامانه SRM",
        centerX: 750,
        centerY: 500,
        description:
          "سامانه نتایج اعضا، تأییدها، مخالفت‌ها و اختلاف‌نظرها را تجمیع و به مدیر نمایش می‌دهد.",
      },
      {
        id: "final-review",
        title: "بررسی نهایی مدیر",
        start: 56,
        end: 60,
        department: "مدیریت بازرگانی",
        owner: "مدیر بازرگانی",
        centerX: 1050,
        centerY: 500,
        description:
          "مدیر بازرگانی نتایج کمیسیون را بررسی کرده و تصمیم نهایی را درباره پرونده ثبت می‌کند.",
      },
    ];

    const nodes: FlowNode[] = [];

    nodes.push(
      makeNode(
        "start",
        "شروع فرآیند",
        "start",
        1650,
        220,
        [],
        "مدیریت بازرگانی",
        "سامانه SRM",
        "پیشنهادها و اطلاعات کمیسیون به کارتابل مدیر بازرگانی ارسال می‌شوند.",
        "پیشنهادهای تأمین‌کنندگان و اطلاعات کمیسیون",
        "ایجاد پرونده و ثبت زمان ورود",
        "پرونده فعال در کارتابل مدیر",
        "دریافت پیشنهادها و تشکیل کمیسیون",
        "دریافت و تشکیل پرونده",
      ),
    );

    groups.forEach((group, index) => {
      const details = titles.slice(group.start, group.end + 1);

      nodes.push(
        makeNode(
          group.id,
          group.title,
          group.id === "ranking" || group.id === "aggregation"
            ? "system"
            : group.id === "final-review"
              ? "approval"
              : "task",
          group.centerX,
          group.centerY,
          details,
          group.department,
          group.owner,
          group.description,
          details[0] ?? "اطلاعات مراحل قبل",
          details.join("، "),
          details[details.length - 1] ?? "نتیجه مرحله",
          "تکمیل اقدامات و ثبت نتیجه مرحله",
          groups[index + 1]?.title ?? "تصمیم نهایی مدیر",
        ),
      );
    });

    nodes.push(
      makeNode(
        "decision",
        "تصمیم نهایی مدیر",
        "decision",
        1350,
        500,
        titles.slice(61),
        "مدیریت بازرگانی",
        "مدیر بازرگانی",
        "مدیر بازرگانی با توجه به نظر اعضا، مستندات و شرایط معامله، وضعیت نهایی پرونده را تعیین می‌کند.",
        "نتایج تجمیع‌شده کمیسیون و پیشنهاد منتخب",
        "انتخاب مسیر تأیید، عودت یا رد نهایی",
        "تعیین وضعیت پرونده",
        "تصمیم نهایی مدیر بازرگانی",
        "تأیید، عودت یا رد نهایی",
      ),
    );

    nodes.push(
      makeNode(
        "approved",
        "تأیید و ادامه فرآیند خرید",
        "end",
        1600,
        820,
        titles.filter((title) =>
          [
            "تعیین تأمین‌کننده یا تأمین‌کنندگان برنده",
            "ثبت مبلغ نهایی و شرایط مورد تأیید",
            "ثبت تأیید نهایی مدیر",
            "ثبت سوابق و مستندات کمیسیون",
            "ارسال نتیجه به مرحله بعد فرآیند خرید",
          ].includes(title),
        ),
        "مدیریت بازرگانی",
        "مدیر بازرگانی",
        "پرونده تأیید شده و نتیجه برای ادامه فرآیند خرید ارسال می‌شود.",
        "تصمیم نهایی تأیید",
        "ثبت برنده، مبلغ و شرایط نهایی و ارسال نتیجه",
        "ارجاع به مرحله بعد خرید",
        "تأیید نهایی",
        "مرحله بعد فرآیند خرید",
      ),
    );

    nodes.push(
      makeNode(
        "returned",
        "عودت برای بررسی مجدد",
        "task",
        900,
        820,
        titles.filter((title) =>
          [
            "ثبت دلیل عودت برای بررسی مجدد",
            "ارجاع مجدد به اعضای کمیسیون",
            "ایجاد دور جدید بررسی",
            "حفظ سوابق دور قبلی",
          ].includes(title),
        ),
        "مدیریت بازرگانی و کمیسیون",
        "مدیر بازرگانی",
        "در صورت نیاز به بررسی مجدد، پرونده با ذکر دلیل به اعضای کمیسیون بازگردانده می‌شود.",
        "تصمیم عودت و توضیحات مدیر",
        "ثبت علت عودت و ایجاد دور جدید بررسی",
        "پرونده ارجاع‌شده به کمیسیون",
        "وجود نقص یا اختلاف‌نظر نیازمند بررسی مجدد",
        "بررسی مجدد توسط اعضای کمیسیون",
      ),
    );

    nodes.push(
      makeNode(
        "rejected",
        "رد نهایی و بستن پرونده",
        "end",
        300,
        820,
        titles.filter((title) =>
          [
            "ثبت علت رد نهایی",
            "تعیین وضعیت نهایی پرونده",
            "بستن پرونده",
            "پایان فرآیند",
          ].includes(title),
        ),
        "مدیریت بازرگانی",
        "مدیر بازرگانی",
        "در صورت رد نهایی، علت رد ثبت و پرونده مختومه می‌شود.",
        "تصمیم رد نهایی",
        "ثبت دلیل رد و بستن پرونده",
        "پرونده مختومه",
        "عدم تأیید نهایی",
        "پایان فرآیند",
      ),
    );

    return nodes;
  }

  const positions = [
    [1030, 260],
    [820, 260],
    [610, 260],
    [400, 260],
    [190, 260],
    [190, 520],
    [400, 520],
    [610, 520],
    [820, 520],
    [1030, 520],
  ];

  const nodes: FlowNode[] = [];

  nodes.push({
    id: "start",
    title: "آغاز فرآیند",
    kind: "start",
    x: 1260,
    y: 260,
    department: process.owner,
    owner: "راهبر فرآیند",
    description: `شروع رسمی فرآیند «${process.title}» پس از دریافت محرک و اطلاعات اولیه.`,
    inputs: "درخواست یا رویداد آغازکننده",
    actions: "ثبت زمان آغاز و تخصیص شناسه پیگیری",
    output: "پرونده فعال فرآیند",
    condition: "وجود اطلاعات پایه معتبر",
    next: titles[0],
  });

  titles.forEach((title, index) => {
    const isDecision = index === Math.min(3, titles.length - 2);
    const isApproval = index === titles.length - 1;
    const [x, y] = positions[index];

    nodes.push({
      id: `node-${index}`,
      title,
      kind: isDecision
        ? "decision"
        : isApproval
          ? "approval"
          : index === 2
            ? "document"
            : index === 4
              ? "system"
              : "task",
      x,
      y,
      department:
        index % 3 === 0
          ? process.owner
          : index % 3 === 1
            ? "واحد کنترل و تطبیق"
            : "سامانه SRM",
      owner:
        index % 3 === 2
          ? "کارشناس مسئول"
          : index % 3 === 1
            ? "سرپرست واحد"
            : "مالک فرآیند",
      description: `در این مرحله، ${title} مطابق ضوابط مصوب سازمان انجام و نتیجه آن در پرونده فرآیند ثبت می‌شود.`,
      inputs:
        index === 0
          ? "پرونده فعال و اطلاعات اولیه"
          : `خروجی مرحله «${titles[index - 1]}»`,
      actions: "بررسی اطلاعات، ثبت نتیجه و بارگذاری مستندات پشتیبان",
      output: `نتیجه مستند ${title}`,
      condition: isDecision
        ? "انطباق کامل اطلاعات با ضوابط و حدود اختیار"
        : isApproval
          ? "تأیید مسئول مجاز و تکمیل مستندات"
          : "تکمیل اطلاعات موردنیاز",
      next: index === titles.length - 1 ? "پایان فرآیند" : titles[index + 1],
    });
  });

  const lastIndex = titles.length - 1;
  const lastPosition = positions[lastIndex];
  const lastIsTopRow = lastIndex < 5;
  const endX = lastIsTopRow
    ? Math.max(20, lastPosition[0] - 130)
    : lastPosition[0] + 210;

  nodes.push({
    id: "end",
    title: "تکمیل فرآیند",
    kind: "end",
    x: endX,
    y: lastPosition[1],
    department: process.owner,
    owner: "سامانه SRM",
    description:
      "فرآیند با ثبت نتیجه نهایی و اطلاع‌رسانی به ذی‌نفعان خاتمه می‌یابد.",
    inputs: "نتیجه نهایی تأییدشده",
    actions: "ثبت تاریخچه و ارسال اعلان سیستمی",
    output: "پرونده تکمیل‌شده",
    condition: "تکمیل همه کنترل‌های الزامی",
    next: "پایان فرآیند",
  });

  return nodes;
}

const kindMeta: Record<NodeKind, { label: string; className: string }> = {
  start: { label: "رویداد آغاز", className: "start-node" },
  end: { label: "رویداد پایان", className: "end-node" },
  task: { label: "فعالیت کاربر", className: "task-node" },
  system: { label: "فعالیت سیستمی", className: "system-node" },
  approval: { label: "تأیید و تصویب", className: "approval-node" },
  decision: { label: "درگاه تصمیم", className: "decision-node" },
  document: { label: "بررسی مستندات", className: "document-node" },
};

function Brand() {
  return (
    <div className="brand">
      <div className="brand-text">
        <strong>گروه زر</strong>
        <small>معماری فرآیندهای تأمین</small>
      </div>

      <img className="brand-logo" src="/logo.svg" alt="لوگوی گروه زر" />
    </div>
  );
}

function Header({ onHome }: { onHome?: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button
          className="brand-button"
          onClick={onHome}
          aria-label="صفحه نخست"
        >
          <Brand />
        </button>

        <div className="header-title">
          <strong>مهیا نظری - کارشناس SRM</strong>
        </div>
      </div>
    </header>
  );
}

function ProcessCard({
  process,
  onOpen,
}: {
  process: Process;
  onOpen: () => void;
}) {
  const accent = categories.find(
    (category) => category.title === process.category,
  )?.accent;

  return (
    <button
      className="process-card"
      onClick={onOpen}
      style={{ "--category-accent": accent } as CSSProperties}
    >
      <div className="card-copy">
        <h3>{process.title}</h3>
        <p>{process.description}</p>
      </div>

      <div className="card-footer">
        <span className="view-flow">
          مشاهده گردش کار <i>←</i>
        </span>
      </div>
    </button>
  );
}

function ProcessCarousel({
  items,
  onOpen,
}: {
  items: Process[];
  onOpen: (process: Process) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  const move = (direction: "previous" | "next") => {
    const rail = railRef.current;
    if (!rail) return;

    const card = rail.querySelector<HTMLElement>(".process-card");
    const distance = card ? card.offsetWidth + 16 : 320;

    // در چیدمان راست‌به‌چپ، «بعدی» یعنی اسکرول به سمت منفی
    const sign = getComputedStyle(rail).direction === "rtl" ? -1 : 1;

    rail.scrollBy({
      left: (direction === "next" ? distance : -distance) * sign,
      behavior: "smooth",
    });
  };

  return (
    <div className="process-carousel">
      <button
        className="carousel-arrow carousel-arrow-prev"
        type="button"
        onClick={() => move("previous")}
        aria-label="نمایش کارت‌های قبلی"
        title="قبلی"
      >
        <span aria-hidden="true">›</span>
      </button>

      <div className="process-grid" ref={railRef}>
        {items.map((process) => (
          <ProcessCard
            key={process.id}
            process={process}
            onOpen={() => onOpen(process)}
          />
        ))}
      </div>

      <button
        className="carousel-arrow carousel-arrow-next"
        type="button"
        onClick={() => move("next")}
        aria-label="نمایش کارت‌های بعدی"
        title="بعدی"
      >
        <span aria-hidden="true">‹</span>
      </button>
    </div>
  );
}

function Home({ onOpen }: { onOpen: (process: Process) => void }) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? visibleProcesses.filter((process) =>
        `${process.title} ${process.description} ${process.category}`.includes(
          query,
        ),
      )
    : visibleProcesses;

  return (
    <div className="home">
      <Header />

      <main>
        <section className="process-directory" id="processes">
          <div className="directory-heading">
            <div>
              <h1>نقشه فرآیندهای SRM</h1>
              <p>فرآیند موردنظر را برای مشاهده گردش کار انتخاب کنید.</p>
            </div>

            <label className="search">
              <span aria-hidden="true">⌕</span>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جست‌وجو در فرآیندها..."
              />

              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="پاک کردن"
                  type="button"
                >
                  ×
                </button>
              )}
            </label>
          </div>

          {categories.map((category) => {
            const categoryProcesses = filtered.filter(
              (process) => process.category === category.title,
            );

            if (!categoryProcesses.length) return null;

            return (
              <div
                className="category-block"
                key={category.id}
                style={
                  { "--category-accent": category.accent } as CSSProperties
                }
              >
                <div className="category-header">
                  <div className="category-text">
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                  </div>

                  <span className="category-count">
                    {toPersianNumber(categoryProcesses.length)} فرآیند
                  </span>
                </div>

                <ProcessCarousel
                  items={categoryProcesses}
                  onOpen={onOpen}
                />
              </div>
            );
          })}

          {!filtered.length && (
            <div className="empty-state">
              <strong>فرآیندی یافت نشد</strong>
              <span>عبارت دیگری را جست‌وجو کنید.</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function DetailPanel({
  node,
  svgUrl,
  onClose,
  onSetSvg,
}: {
  node: FlowNode;
  svgUrl?: string;
  onClose: () => void;
  onSetSvg: (value?: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    setFileError("");
  }, [node.id]);

  const uploadSvg = (file?: File) => {
    if (!file) return;

    const isSvg =
      file.type === "image/svg+xml" ||
      file.name.toLowerCase().endsWith(".svg");

    if (!isSvg) {
      setFileError("فقط فایل SVG قابل بارگذاری است.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setFileError("حجم فایل باید کمتر از یک مگابایت باشد.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        onSetSvg(reader.result);
        setFileError("");
      }
    };

    reader.onerror = () => {
      setFileError("خواندن فایل با خطا مواجه شد.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <aside className="details-panel">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <span className={`panel-kind ${kindMeta[node.kind].className}`}>
            {kindMeta[node.kind].label}
          </span>

          <h2>{node.title}</h2>
        </div>

        <button
          className="close-panel"
          onClick={onClose}
          aria-label="بستن پنل"
          type="button"
        >
          ×
        </button>
      </div>

      <section className="panel-description">
        <span className="panel-label">توضیح مرحله</span>
        <p>{node.description}</p>
      </section>

      <div className="owner-box">
        <div>
          <span>مسئول انجام</span>
          <strong>{node.owner}</strong>
        </div>

        <i />

        <div>
          <span>واحد سازمانی</span>
          <strong>{node.department}</strong>
        </div>
      </div>

      <div className="panel-io">
        {node.inputs && (
          <div className="io-card">
            <span className="io-icon input-icon">↓</span>
            <div>
              <label>ورودی مرحله</label>
              <p>{node.inputs}</p>
            </div>
          </div>
        )}

        {node.output && (
          <div className="io-card">
            <span className="io-icon output-icon">↑</span>
            <div>
              <label>خروجی مرحله</label>
              <p>{node.output}</p>
            </div>
          </div>
        )}
      </div>

      <section className="stage-assets compact-assets">
        <div className="panel-section-heading">
          <div>
            <strong>فایل و نمودار مرحله</strong>
            <span>پیوست SVG</span>
          </div>

          <button
            className="upload-svg-button"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {svgUrl ? "جایگزینی" : "آپلود SVG"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            hidden
            onChange={(event) => {
              uploadSvg(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </div>

        {fileError && <p className="file-error">{fileError}</p>}

        {svgUrl ? (
          <div className="svg-preview">
            <img src={svgUrl} alt={`نمودار مرحله ${node.title}`} />

            <button
              onClick={() => onSetSvg(undefined)}
              aria-label="حذف SVG"
              type="button"
            >
              حذف فایل
            </button>
          </div>
        ) : (
          <button
            className="svg-empty"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <span>＋</span>
            <span>انتخاب فایل SVG</span>
          </button>
        )}
      </section>
    </aside>
  );
}

// ساخت یک PDF تک‌صفحه‌ای شامل تصویر JPEG (بدون نیاز به کتابخانه)
function buildPdf(
  jpeg: Uint8Array,
  imgWidth: number,
  imgHeight: number,
  pageWidth: number,
  pageHeight: number,
): Blob {
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];
  const offsets: number[] = [];
  let length = 0;

  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    parts.push(bytes as BlobPart);
    length += bytes.length;
  };

  const object = (id: number, write: () => void) => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
    write();
    push("\nendobj\n");
  };

  const content = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im0 Do Q`;

  push("%PDF-1.4\n");
  object(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
  object(2, () => push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
  object(3, () =>
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    ),
  );
  object(4, () => {
    push(
      `<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    );
    push(jpeg);
    push("\nendstream");
  });
  object(5, () =>
    push(
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    ),
  );

  const xrefOffset = length;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let id = 1; id <= 5; id++) {
    xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  push(
    `${xref}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return new Blob(parts, { type: "application/pdf" });
}

function WorkflowViewer({
  process,
  onBack,
}: {
  process: Process;
  onBack: () => void;
}) {
  const nodes = useMemo(() => generateNodes(process), [process]);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const imageViewerRef = useRef<HTMLDivElement>(null);
  const registrationImageRef = useRef<HTMLImageElement>(null);

  const [selected, setSelected] = useState<FlowNode | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [fitImageWidth, setFitImageWidth] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 20 });
  const [stageSvgs, setStageSvgs] = useState<Record<string, string>>({});

  const isImageProcess = true;

  useEffect(() => {
    setImageLoadError(false);
    setImageZoom(1);
    setFitImageWidth(0);
  }, [process.id]);

  const drag = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
  } | null>(null);

  const imagePan = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);

  const resetPosition = () => {
    setPosition({ x: 0, y: 20 });
  };

  const calculateFitWidth = () => {
    const viewer = imageViewerRef.current;
    const image = registrationImageRef.current;

    if (!viewer || !image || !image.naturalWidth || !image.naturalHeight) {
      return;
    }

    // عرض تصویر = کل عرض قاب؛ اگر بلند بود، داخل قاب اسکرول می‌شود
    const availableWidth = Math.max(100, viewer.clientWidth - 8);

    setFitImageWidth(availableWidth);
  };

  useEffect(() => {
    if (!isImageProcess) return;

    const viewer = imageViewerRef.current;
    const image = registrationImageRef.current;

    if (!viewer || !image) return;

    const update = () => {
      calculateFitWidth();
    };

    if (image.complete) {
      update();
    }

    const resizeObserver = new ResizeObserver(update);

    resizeObserver.observe(viewer);

    if (workspaceRef.current) {
      resizeObserver.observe(workspaceRef.current);
    }

    window.addEventListener("resize", update);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [isImageProcess]);

  const resetImageZoom = () => {
    setImageZoom(1);

    requestAnimationFrame(() => {
      calculateFitWidth();

      imageViewerRef.current?.scrollTo({
        left: 0,
        top: 0,
        behavior: "smooth",
      });
    });
  };

  const zoomImage = (
    amount: number,
    clientX?: number,
    clientY?: number,
  ) => {
    const viewer = imageViewerRef.current;

    setImageZoom((current) => {
      const next = Math.min(
        4,
        Math.max(1, Number((current + amount).toFixed(2))),
      );

      if (viewer && next !== current) {
        const rect = viewer.getBoundingClientRect();

        const focusX =
          clientX === undefined
            ? viewer.clientWidth / 2
            : clientX - rect.left;

        const focusY =
          clientY === undefined
            ? viewer.clientHeight / 2
            : clientY - rect.top;

        const contentX = viewer.scrollLeft + focusX;
        const contentY = viewer.scrollTop + focusY;
        const ratio = next / current;

        requestAnimationFrame(() => {
          viewer.scrollLeft = contentX * ratio - focusX;
          viewer.scrollTop = contentY * ratio - focusY;
        });
      }

      return next;
    });
  };

  const handleImagePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (imageZoom <= 1) return;
    if (event.button !== 0) return;

    const viewer = imageViewerRef.current;
    if (!viewer) return;

    event.preventDefault();

    imagePan.current = {
      x: event.clientX,
      y: event.clientY,
      left: viewer.scrollLeft,
      top: viewer.scrollTop,
    };

    viewer.setPointerCapture(event.pointerId);
    viewer.style.cursor = "grabbing";
  };

  const handleImagePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (!imagePan.current || !imageViewerRef.current) return;

    const viewer = imageViewerRef.current;

    viewer.scrollLeft =
      imagePan.current.left - (event.clientX - imagePan.current.x);

    viewer.scrollTop =
      imagePan.current.top - (event.clientY - imagePan.current.y);
  };

  const handleImagePointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    imagePan.current = null;

    const viewer = imageViewerRef.current;
    if (viewer) {
      viewer.style.cursor = "grab";
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await workspaceRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  // دانلود مستقیم PDF به نام فرآیند (بدون پنجره‌ی چاپ)
  const downloadPDF = async () => {
    if (pdfBusy) return;

    setPdfBusy(true);

    let objectUrl = "";

    try {
      const response = await fetch(process.svgPath);
      if (!response.ok) throw new Error("SVG fetch failed");

      const svgBlob = await response.blob();
      objectUrl = URL.createObjectURL(
        svgBlob.type === "image/svg+xml"
          ? svgBlob
          : new Blob([svgBlob], { type: "image/svg+xml" }),
      );

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("SVG decode failed"));
        img.src = objectUrl;
      });

      const width = img.naturalWidth || 1600;
      const height = img.naturalHeight || 1000;

      // کیفیت بالا، با سقف ایمن برای اندازه‌ی کانواس
      const scale = Math.max(
        0.1,
        Math.min(2, 8000 / Math.max(width, height), Math.sqrt(80e6 / (width * height))),
      );
      const canvasWidth = Math.round(width * scale);
      const canvasHeight = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      const jpegBlob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("JPEG failed"))),
          "image/jpeg",
          0.92,
        ),
      );
      const jpeg = new Uint8Array(await jpegBlob.arrayBuffer());

      // اندازه‌ی صفحه = اندازه‌ی تصویر (حداکثر مجاز PDF حدود ۱۴۴۰۰)
      const pageScale = Math.min(1, 14000 / Math.max(width, height));
      const pdf = buildPdf(
        jpeg,
        canvasWidth,
        canvasHeight,
        Math.round(width * pageScale),
        Math.round(height * pageScale),
      );

      const fileName =
        process.title.trim().replace(/[\\/:*?"<>|]+/g, " ").trim() ||
        "process";

      const link = document.createElement("a");
      const pdfUrl = URL.createObjectURL(pdf);
      link.href = pdfUrl;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
    } catch (error) {
      console.error("PDF export error:", error);
      window.alert("ساخت فایل PDF با خطا مواجه شد. دوباره تلاش کنید.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPdfBusy(false);
    }
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!drag.current) return;

      setPosition({
        x: drag.current.px + event.clientX - drag.current.x,
        y: drag.current.py + event.clientY - drag.current.y,
      });
    };

    const onUp = () => {
      drag.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const standardConnector = (node: FlowNode, next: FlowNode) => {
    const width = nodeWidth(node);
    const height = nodeHeight(node);
    const nextWidth = nodeWidth(next);
    const nextHeight = nodeHeight(next);

    const sameRow = Math.abs(node.y - next.y) < 10;

    if (sameRow) {
      if (next.x < node.x) {
        return `M ${node.x} ${node.y} H ${next.x + nextWidth}`;
      }

      return `M ${node.x + width} ${node.y} H ${next.x}`;
    }

    const sourceX = node.x + width / 2;
    const sourceY = node.y + height / 2;
    const targetX = next.x + nextWidth / 2;
    const targetY = next.y - nextHeight / 2;

    if (Math.abs(sourceX - targetX) < 5) {
      return `M ${sourceX} ${sourceY} V ${targetY}`;
    }

    const middleY = sourceY + (targetY - sourceY) / 2;

    return `M ${sourceX} ${sourceY} V ${middleY} H ${targetX} V ${targetY}`;
  };

  const stageKey = (nodeId: string) => `${process.id}-${nodeId}`;

  return (
    <div className="workflow-page workflow-page-clean">
      <div className="workflow-head compact-workflow-head">
        <div className="workflow-title-area">
          <button
            className="back-button"
            onClick={onBack}
            aria-label="بازگشت به فرآیندها"
            title="بازگشت به فهرست فرآیندها"
            type="button"
          >
            <span className="back-arrow" aria-hidden="true">
              →
            </span>
            <span>بازگشت</span>
          </button>

          <div className="workflow-title">
            <h1>{process.title}</h1>
            <p>{process.description}</p>
          </div>
        </div>

        <div className="workflow-meta">
          <div>
            <span>مالک فرآیند</span>
            <b>{process.owner}</b>
          </div>

          <button
            className="fullscreen-button"
            onClick={toggleFullscreen}
            type="button"
          >
            <span aria-hidden="true">⛶</span>
            تمام‌صفحه
          </button>

          <button
            className="fullscreen-button pdf-button"
            onClick={downloadPDF}
            disabled={imageLoadError || pdfBusy}
            type="button"
            title="دانلود نمودار این فرآیند به‌صورت PDF"
          >
            <span aria-hidden="true">↓</span>
            {pdfBusy ? "در حال آماده‌سازی…" : "دانلود PDF"}
          </button>
        </div>
      </div>

      <div className="workspace workspace-clean" ref={workspaceRef}>
        {isImageProcess ? (
          <div className="registration-layout">
            <section className="journey-image-section">
              <div className="journey-image-toolbar">
                <div className="journey-image-title">
                  <strong>{`نمای تصویری ${process.title}`}</strong>
                </div>

                <div className="zoom-group">
                  <button
                    type="button"
                    aria-label="بزرگ‌نمایی تصویر"
                    className="image-zoom-control"
                    onClick={() => zoomImage(0.2)}
                  >
                    +
                  </button>

                  <span className="zoom-value">
                    {toPersianNumber(Math.round(imageZoom * 100))}٪
                  </span>

                  <button
                    type="button"
                    aria-label="کوچک‌نمایی تصویر"
                    className="image-zoom-control"
                    onClick={() => zoomImage(-0.2)}
                  >
                    −
                  </button>

                  <button
                    type="button"
                    className="image-zoom-control zoom-reset"
                    onClick={resetImageZoom}
                  >
                    بازنشانی
                  </button>
                </div>
              </div>

              <div
                ref={imageViewerRef}
                className="journey-svg-viewer"
                onWheel={(event) => {
                  event.preventDefault();
                  zoomImage(
                    event.deltaY < 0 ? 0.1 : -0.1,
                    event.clientX,
                    event.clientY,
                  );
                }}
                onPointerDown={handleImagePointerDown}
                onPointerMove={handleImagePointerMove}
                onPointerUp={handleImagePointerUp}
                onPointerCancel={handleImagePointerUp}
                style={{
                  cursor: imageZoom > 1 ? "grab" : "default",
                  touchAction: imageZoom > 1 ? "none" : "pan-x pan-y",
                }}
              >
                {!imageLoadError ? (
                  <img
                    ref={registrationImageRef}
                    src={process.svgPath}
                    alt={`نمای تصویری ${process.title}`}
                    className="journey-svg-image"
                    draggable={false}
                    onLoad={calculateFitWidth}
                    onError={() => setImageLoadError(true)}
                    style={{
                      width: fitImageWidth
                        ? `${fitImageWidth * imageZoom}px`
                        : "100%",
                      margin: imageZoom > 1 ? 0 : "auto",
                    }}
                  />
                ) : (
                  <div className="image-missing">
                    <span className="image-missing-icon">▧</span>

                    <strong>جایگاه تصویر فرآیند آماده است</strong>

                    <span>فایل SVG این فرآیند را در مسیر زیر قرار دهید:</span>

                    <code dir="ltr">{process.svgPath}</code>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <>
            <div
              className="workflow-canvas"
              onPointerDown={(event) => {
                if (
                  (event.target as HTMLElement).closest(
                    ".flow-node, .canvas-toolbar, .details-panel",
                  )
                ) {
                  return;
                }

                drag.current = {
                  x: event.clientX,
                  y: event.clientY,
                  px: position.x,
                  py: position.y,
                };
              }}
            >
              <div
                className="canvas-content"
                style={{
                  width: process.customWorkflow ? 1900 : 1450,
                  height: process.customWorkflow ? 1000 : 720,
                  position: "relative",
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  transformOrigin: "top left",
                }}
              >
                <svg
                  className="connectors"
                  viewBox={
                    process.customWorkflow
                      ? "0 0 1900 1000"
                      : "0 0 1450 720"
                  }
                  style={{
                    width: process.customWorkflow ? 1900 : 1450,
                    height: process.customWorkflow ? 1000 : 720,
                  }}
                  aria-hidden="true"
                >
                  <defs>
                    <marker
                      id={`arrow-${process.id}`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0 0 10 5 0 10Z" fill="#8093A5" />
                    </marker>

                    <marker
                      id={`arrow-success-${process.id}`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0 0 10 5 0 10Z" fill="#647FA6" />
                    </marker>

                    <marker
                      id={`arrow-return-${process.id}`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0 0 10 5 0 10Z" fill="#D69A3A" />
                    </marker>

                    <marker
                      id={`arrow-reject-${process.id}`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0 0 10 5 0 10Z" fill="#D45D5D" />
                    </marker>
                  </defs>

                  {process.customWorkflow ? (
                    <g className="manager-connectors">
                      <path
                        d="M1612 220 H1445"
                        className="connector-line"
                        markerEnd={`url(#arrow-${process.id})`}
                      />
                      <path
                        d="M1255 220 H1145"
                        className="connector-line"
                        markerEnd={`url(#arrow-${process.id})`}
                      />
                      <path
                        d="M955 220 H845"
                        className="connector-line"
                        markerEnd={`url(#arrow-${process.id})`}
                      />
                      <path
                        d="M655 220 H545"
                        className="connector-line"
                        markerEnd={`url(#arrow-${process.id})`}
                      />
                      <path
                        d="M450 275 V445"
                        className="connector-line"
                        markerEnd={`url(#arrow-${process.id})`}
                      />
                      <path
                        d="M545 500 H655"
                        className="connector-line"
                        markerEnd={`url(#arrow-${process.id})`}
                      />
                      <path
                        d="M845 500 H955"
                        className="connector-line"
                        markerEnd={`url(#arrow-${process.id})`}
                      />
                      <path
                        d="M1145 500 H1260"
                        className="connector-line"
                        markerEnd={`url(#arrow-${process.id})`}
                      />
                      <path
                        d="M1350 565 V635 H1600 V776"
                        className="success-line"
                        markerEnd={`url(#arrow-success-${process.id})`}
                      />
                      <path
                        d="M1350 565 V665 H900 V765"
                        className="return-loop"
                        markerEnd={`url(#arrow-return-${process.id})`}
                      />
                      <path
                        d="M1350 565 V715 H300 V776"
                        className="reject-line"
                        markerEnd={`url(#arrow-reject-${process.id})`}
                      />
                      <path
                        d="M900 875 V930 H340 V500 H355"
                        className="return-loop"
                        markerEnd={`url(#arrow-return-${process.id})`}
                      />

                      <text x="1600" y="620" className="success-label">
                        تأیید
                      </text>
                      <text x="900" y="650" className="return-label">
                        عودت برای بررسی مجدد
                      </text>
                      <text x="300" y="700" className="reject-label">
                        رد نهایی
                      </text>
                    </g>
                  ) : (
                    <g className="standard-connectors">
                      {nodes.slice(0, -1).map((node, index) => {
                        const next = nodes[index + 1];

                        return (
                          <path
                            key={`${node.id}-${next.id}`}
                            d={standardConnector(node, next)}
                            className="connector-line"
                            markerEnd={`url(#arrow-${process.id})`}
                          />
                        );
                      })}
                    </g>
                  )}
                </svg>

                {nodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    className={`flow-node ${kindMeta[node.kind].className} ${
                      selected?.id === node.id ? "selected" : ""
                    }`}
                    style={{
                      left: node.x,
                      top: node.y,
                    }}
                    onClick={() => setSelected(node)}
                  >
                    <span className="node-copy">
                      <small>{kindMeta[node.kind].label}</small>
                      <strong>{node.title}</strong>
                      <em>{node.department}</em>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="canvas-reset-bar">
              <button
                type="button"
                className="canvas-reset-button"
                onClick={resetPosition}
              >
                ↻ بازنشانی جایگاه نمودار
              </button>
            </div>

            {selected && (
              <DetailPanel
                node={selected}
                svgUrl={stageSvgs[stageKey(selected.id)]}
                onClose={() => setSelected(null)}
                onSetSvg={(value) => {
                  const key = stageKey(selected.id);

                  setStageSvgs((current) => {
                    if (!value) {
                      const next = { ...current };
                      delete next[key];
                      return next;
                    }

                    return {
                      ...current,
                      [key]: value,
                    };
                  });
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [activeProcess, setActiveProcess] = useState<Process | null>(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeProcess]);

  return activeProcess ? (
    <WorkflowViewer
      process={activeProcess}
      onBack={() => setActiveProcess(null)}
    />
  ) : (
    <Home onOpen={setActiveProcess} />
  );
}