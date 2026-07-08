param(
    [string]$WindowTitle = "Agent Hub"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

public class NativeWindowWrapper : IWin32Window {
    private readonly IntPtr _handle;
    public NativeWindowWrapper(IntPtr handle) { _handle = handle; }
    public IntPtr Handle { get { return _handle; } }
}

public static class WindowFocus {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();

    public static string GetTitle(IntPtr hWnd) {
        var sb = new StringBuilder(512);
        GetWindowText(hWnd, sb, 512);
        return sb.ToString();
    }

    public static bool TitleMatches(string title, string[] parts) {
        if (string.IsNullOrWhiteSpace(title)) return false;
        foreach (var part in parts) {
            if (string.IsNullOrWhiteSpace(part)) continue;
            if (title.IndexOf(part, StringComparison.OrdinalIgnoreCase) >= 0) return true;
        }
        return false;
    }

    public static IntPtr FindVisibleWindowByTitle(string[] titleParts) {
        IntPtr found = IntPtr.Zero;
        EnumWindows((hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;
            if (TitleMatches(GetTitle(hWnd), titleParts)) {
                found = hWnd;
                return false;
            }
            return true;
        }, IntPtr.Zero);
        return found;
    }
}
"@ -ReferencedAssemblies System.Windows.Forms, System.Drawing

function Get-OwnerHandle {
    param([string]$TitleHint)

    $hints = @($TitleHint, "Agent Hub", "localhost:3040", "localhost")
    $foreground = [WindowFocus]::GetForegroundWindow()
    if ($foreground -ne [IntPtr]::Zero) {
        $fgTitle = [WindowFocus]::GetTitle($foreground)
        if ([WindowFocus]::TitleMatches($fgTitle, $hints)) {
            return $foreground
        }
    }

    $found = [WindowFocus]::FindVisibleWindowByTitle($hints)
    if ($found -ne [IntPtr]::Zero) {
        return $found
    }

    if ($foreground -ne [IntPtr]::Zero) {
        return $foreground
    }

    throw "Could not find a browser window to attach the folder picker."
}

[System.Windows.Forms.Application]::EnableVisualStyles()

$ownerHandle = Get-OwnerHandle -TitleHint $WindowTitle
$owner = New-Object NativeWindowWrapper($ownerHandle)

$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
if ($dialog.PSObject.Properties.Match("AutoUpgradeEnabled").Count -gt 0) {
    $dialog.AutoUpgradeEnabled = $true
}
if ($dialog.PSObject.Properties.Match("UseDescriptionForTitle").Count -gt 0) {
    $dialog.UseDescriptionForTitle = $true
}
$dialog.Description = "Select project location"
$dialog.ShowNewFolderButton = $true

$result = $dialog.ShowDialog($owner)
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    [Console]::Out.Write($dialog.SelectedPath)
    exit 0
}
exit 1
