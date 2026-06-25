# Modern Windows folder picker (IFileOpenDialog / Common Item Dialog).
$ErrorActionPreference = "Stop"

$source = @"
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;

public sealed class WinFolderPicker
{
    private readonly List<string> _resultPaths = new List<string>();

    public string ResultPath { get { return _resultPaths.Count > 0 ? _resultPaths[0] : null; } }
    public string Title { get; set; }

    public bool? Show()
    {
        var owner = Process.GetCurrentProcess().MainWindowHandle;
        if (owner == IntPtr.Zero)
        {
            owner = GetDesktopWindow();
        }

        var dialog = (IFileOpenDialog)new FileOpenDialog();
        dialog.SetOptions(FOS.FOS_PICKFOLDERS | FOS.FOS_FORCEFILESYSTEM | FOS.FOS_PATHMUSTEXIST);

        if (!string.IsNullOrEmpty(Title))
        {
            dialog.SetTitle(Title);
        }

        var hr = dialog.Show(owner);
        if (hr == ERROR_CANCELLED)
        {
            return null;
        }

        if (hr != 0)
        {
            return null;
        }

        IShellItem item;
        if (dialog.GetResult(out item) != 0)
        {
            return null;
        }

        string path;
        if (item.GetDisplayName(SIGDN.SIGDN_FILESYSPATH, out path) != 0 || string.IsNullOrEmpty(path))
        {
            return null;
        }

        _resultPaths.Add(path);
        return true;
    }

    [DllImport("user32")]
    private static extern IntPtr GetDesktopWindow();

    private const int ERROR_CANCELLED = unchecked((int)0x800704C7);

    [ComImport, Guid("DC1C5A9C-E88A-4dde-A5A1-60F82A20AEF7")]
    private class FileOpenDialog { }

    [ComImport, Guid("d57c7288-d4ad-4768-be02-9d969532d960"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IFileOpenDialog
    {
        [PreserveSig] int Show(IntPtr parent);
        [PreserveSig] int SetFileTypes();
        [PreserveSig] int SetFileTypeIndex(int iFileType);
        [PreserveSig] int GetFileTypeIndex(out int piFileType);
        [PreserveSig] int Advise();
        [PreserveSig] int Unadvise();
        [PreserveSig] int SetOptions(FOS fos);
        [PreserveSig] int GetOptions(out FOS pfos);
        [PreserveSig] int SetDefaultFolder(IShellItem psi);
        [PreserveSig] int SetFolder(IShellItem psi);
        [PreserveSig] int GetFolder(out IShellItem ppsi);
        [PreserveSig] int GetCurrentSelection(out IShellItem ppsi);
        [PreserveSig] int SetFileName([MarshalAs(UnmanagedType.LPWStr)] string pszName);
        [PreserveSig] int GetFileName([MarshalAs(UnmanagedType.LPWStr)] out string pszName);
        [PreserveSig] int SetTitle([MarshalAs(UnmanagedType.LPWStr)] string pszTitle);
        [PreserveSig] int SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string pszText);
        [PreserveSig] int SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string pszLabel);
        [PreserveSig] int GetResult(out IShellItem ppsi);
        [PreserveSig] int AddPlace(IShellItem psi, int alignment);
        [PreserveSig] int SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string pszDefaultExtension);
        [PreserveSig] int Close(int hr);
        [PreserveSig] int SetClientGuid();
        [PreserveSig] int ClearClientData();
        [PreserveSig] int SetFilter([MarshalAs(UnmanagedType.IUnknown)] object pFilter);
        [PreserveSig] int GetResults(out IShellItemArray ppenum);
        [PreserveSig] int GetSelectedItems([MarshalAs(UnmanagedType.IUnknown)] out object ppsai);
    }

    [ComImport, Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IShellItem
    {
        [PreserveSig] int BindToHandler();
        [PreserveSig] int GetParent();
        [PreserveSig] int GetDisplayName(SIGDN sigdnName, [MarshalAs(UnmanagedType.LPWStr)] out string ppszName);
        [PreserveSig] int GetAttributes();
        [PreserveSig] int Compare();
    }

    [ComImport, Guid("b63ea76d-1f85-456f-a19c-48159efa858b"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IShellItemArray
    {
        [PreserveSig] int BindToHandler();
        [PreserveSig] int GetPropertyStore();
        [PreserveSig] int GetPropertyDescriptionList();
        [PreserveSig] int GetAttributes();
        [PreserveSig] int GetCount(out int pdwNumItems);
        [PreserveSig] int GetItemAt(int dwIndex, out IShellItem ppsi);
        [PreserveSig] int EnumItems();
    }

    private enum SIGDN : uint
    {
        SIGDN_FILESYSPATH = 0x80058000,
    }

    [Flags]
    private enum FOS
    {
        FOS_PICKFOLDERS = 0x20,
        FOS_FORCEFILESYSTEM = 0x40,
        FOS_PATHMUSTEXIST = 0x800,
    }
}
"@

Add-Type -TypeDefinition $source -ErrorAction Stop

$picker = New-Object WinFolderPicker
$picker.Title = "Select project location"
$result = $picker.Show()
if ($result -eq $true -and $picker.ResultPath) {
    [Console]::Out.Write($picker.ResultPath)
    exit 0
}
exit 1
