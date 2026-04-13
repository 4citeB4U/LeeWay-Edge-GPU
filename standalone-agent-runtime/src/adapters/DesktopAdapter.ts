import robot from "robotjs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class DesktopAdapter {
  async focusWindow({ args }: any) {
    // Windows-specific PowerShell bridge to focus a window by title
    try {
      if (args.windowTitle) {
        const script = `
          $wshell = New-Object -ComObject WScript.Shell;
          $wshell.AppActivate("${args.windowTitle}")
        `;
        await execAsync(`powershell -Command "${script}"`);
      }
      return { focused: true, windowTitle: args.windowTitle };
    } catch (e) {
      return { focused: false, error: e.message };
    }
  }

  async moveMouse({ args }: any) {
    robot.moveMouse(args.x, args.y);
    return { moved: true };
  }

  async click({ args }: any) {
    robot.mouseClick(args.button || "left");
    return { clicked: true };
  }

  async typeText({ args }: any) {
    robot.typeString(args.text);
    return { typed: true };
  }

  async keyTap({ args }: any) {
    robot.keyTap(args.key, args.modifiers || []);
    return { tapped: true };
  }
}
