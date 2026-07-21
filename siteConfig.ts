export const siteConfig = {
  name: "fgs计算机协会",
  description: "fgs计算机协会官方网站",
  logo: "/favicon.ico",
  defaultUserAvatar: "",
  defaultLingshi: -1,
};

export const routes = {
  home: "/",
  taskHall: "/task-hall",
  sectAffairs: "/sect-affairs",
};

export interface NavMenuItem {
  label: string;
  href: string;
}

export const navMenuItems: NavMenuItem[] = [
  { label: "首页", href: routes.home },
  { label: "任务大厅", href: routes.taskHall },
  { label: "宗门事务", href: routes.sectAffairs },
];
