# -*- coding: utf-8 -*-
import os
import sys
import subprocess
import time

# 解决 Windows 控制台输出中文乱码问题
if sys.platform == "win32":
    os.system("chcp 65001 >nul")

def run_cmd(cmd, check=False):
    """执行系统命令并返回输出"""
    try:
        result = subprocess.run(
            cmd, shell=True, check=check, text=True, 
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return e.stdout.strip() if e.stdout else ""

def main():
    # ================= 第零步 =================
    skip_clone = 0
    current_dir = os.getcwd()
    
    if os.path.basename(current_dir).lower() in ["desktop", "桌面"]:
        clone_url = input("检测到当前在桌面，请输入要克隆的项目地址 (留空跳过): ").strip()
        if clone_url:
            # 修复 2：去掉末尾可能存在的斜杠，防止目录名为空
            clone_url = clone_url.rstrip('/')
            repo_name = clone_url.split('/')[-1].replace('.git', '')
            print(f"正在克隆 {clone_url} ...")
            os.system(f"git clone {clone_url}")
            if os.path.exists(repo_name):
                os.chdir(repo_name)
                print(f"已进入目录: {os.path.abspath(repo_name)}")
            else:
                print("克隆失败，请检查网络或地址是否正确！")
                sys.exit(1)
    else:
        skip_clone = 1

    # ================= 第一步 =================
    if not os.path.exists(".git"):
        print("错误：当前目录不含 Git ！")
        sys.exit(1)
        
    abs_path = os.path.abspath(os.getcwd())

    # ================= 第二步 =================
    remote_checked = 0
    remote_url = run_cmd("git remote get-url origin")
    
    print("\n" + "="*40)
    if remote_url and remote_checked == 0:
        print(f"📦 远程仓库地址: {remote_url}")
        if "fork" in remote_url.lower():
            print("💡 提示: 这是一个 Fork 仓库。")
        remote_checked = 1
        
    if not remote_url:
        print("⚠️ 警告: 当前仓库未配置远程地址！后续提交可能会失败。")

    # ================= 第三步 =================
    current_branch = run_cmd("git rev-parse --abbrev-ref HEAD")
    last_branch_file = os.path.join(".git", ".last_branch")
    
    if os.path.exists(last_branch_file):
        with open(last_branch_file, "r", encoding="utf-8") as f:
            last_branch = f.read().strip()
            
        if last_branch and current_branch != last_branch:
            print(f"⚠️ 警告: 当前分支 [{current_branch}] 与记录分支 [{last_branch}] 不一致！")
            confirm = input("是否确认使用当前分支提交？(y/Y 确认): ").strip()
            if confirm.lower() != 'y':
                print("已取消提交。")
                sys.exit(0)
    
    with open(last_branch_file, "w", encoding="utf-8") as f:
        f.write(current_branch)
    print(f"🌿 当前所在分支: {current_branch}")
    print(f"📁 当前绝对路径: {abs_path}")
    
    # 修复 3：只有远程有该分支时才执行 pull，避免首次推送报错
    if remote_url:
        check_branch = run_cmd(f"git ls-remote --heads origin {current_branch}")
        if check_branch:
            print(f"🔄 正在尝试拉取远程 [{current_branch}] 分支最新代码...")
            pull_res = run_cmd(f"git pull origin {current_branch}")
            if "fatal" in pull_res.lower() or "error" in pull_res.lower():
                print(f"⚠️ 拉取代码提示: {pull_res.splitlines()[-1] if pull_res else '失败'}")
        else:
            print("ℹ️ 远程仓库暂无此分支，跳过拉取（将作为新分支推送）。")
    print("="*40 + "\n")

    # ================= 第四步 =================
    print("正在检查文件变更...")
    run_cmd("git add .")
    
    status = run_cmd("git status --porcelain")
    if not status:
        print("没有检测到任何代码改动，跳过提交。")
        sys.exit(0)
        
    commit_msg = input("输入commit名: ").strip()
    if not commit_msg:
        commit_msg = "Auto commit by script"
        
    print(f"正在提交: {commit_msg} ...")
    commit_result = run_cmd(f'git commit -m "{commit_msg}"')
    if "nothing to commit" in commit_result.lower():
        print("暂无改动需要提交。")
        sys.exit(0)

    # ================= 第五步 =================
    print("正在检测网络连通性...")
    
    # 校验一：Ping
    ping_cmd = "ping -n 1 github.com" if sys.platform == "win32" else "ping -c 1 github.com"
    ping_res = run_cmd(ping_cmd)
    if "TTL=" not in ping_res and "ttl=" not in ping_res and "1 received" not in ping_res:
        print("❌ 网络错误：Ping github.com 失败，停止运行。")
        sys.exit(1)
        
    # 校验二：Git 远程服务
    if remote_url:
        print("正在校验 Git 远程仓库可达性...")
        ls_remote_res = run_cmd(f"git ls-remote {remote_url} HEAD")
        
        # 修复 1：精准判断报错信息，而不是去判断有没有 "HEAD"
        if not ls_remote_res or "fatal" in ls_remote_res.lower() or "error" in ls_remote_res.lower():
            print("❌ 致命错误：无法连接到远程 Git 仓库，请检查代理或权限，停止运行。")
            sys.exit(1)
            
    print("✅ 网络及 Git 连通性正常。")

    # ================= 第六步 =================
    max_retries = 25
    confirm_threshold = 10
    has_confirmed = False

    for attempt in range(max_retries):
        print(f"正在推送到远程仓库 (第 {attempt + 1} 次尝试)...")
        push_result = run_cmd("git push")
        push_lower = push_result.lower()
        
        if "error" not in push_lower and "fatal" not in push_lower and "rejected" not in push_lower:
            print("✅ 提交推送成功！")
            break
        else:
            print("提交失败。")
            
            if "authentication" in push_lower or "permission" in push_lower or "denied" in push_lower:
                print("❌ 致命错误：认证失败或权限不足，请检查 SSH Key 或 Token。停止运行。")
                sys.exit(1)
                
            if "rejected" in push_lower:
                print("❌ 致命错误：推送被拒绝（通常是因为产生冲突）。请手动 git pull。停止运行。")
                sys.exit(1)

            # 10次询问逻辑
            if (attempt + 1) == confirm_threshold and not has_confirmed:
                print(f"⚠️ 已达到 {confirm_threshold} 次最大重试次数，网络似乎不稳定。")
                confirm = input("是否继续重试 (最多再试15次)？(y/Y 继续，其他键终止): ").strip()
                if confirm.lower() != 'y':
                    print("❌ 用户取消继续重试，终止提交。")
                    sys.exit(1)
                else:
                    print("🔄 用户确认继续，将进行剩余的重试...")
                    has_confirmed = True

            if (attempt + 1) == max_retries:
                print(f"❌ 已达到总计 {max_retries} 次最大重试次数，网络持续异常，终止提交。")
                sys.exit(1)
                
            print("等待 3 秒后重试：")
            for _ in range(3):
                time.sleep(1)
                print("喵", end="", flush=True)
            print()

if __name__ == "__main__":
    main()