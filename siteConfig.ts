export const siteConfig = {
  name: "计算机协会",
  description: "fgs计算机协会官方网站",
  logo: "/favicon.ico",
  defaultUserAvatar: "",
  defaultLingshi: -1,
};

export const routes = {
  home: "/",
  taskHall: "/task-hall",
  sectAffairs: "/sect-affairs",
  announcement: "/announcement",
  finance: "/finance",
};

export interface NavMenuItem {
  label: string;
  href: string;
}

export const navMenuItems: NavMenuItem[] = [
  { label: "首页", href: routes.home },
  { label: "公告栏", href: routes.announcement },
  { label: "任务大厅", href: routes.taskHall },
  { label: "财务" , href: routes.finance},
  { label: "宗门事务", href: routes.sectAffairs },
];
