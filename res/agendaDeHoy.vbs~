Option Explicit
On Error Resume Next

' Open today's agenda in editor (Amaya)
' Has to build an URL like C:\doc\2007\agenda20070408.html 
' and then start an Amaya with that URL as the qargument.
' Amaya is installed in: C:\amaya\WindowsWX\bin\amaya.exe

    dim d               ' today's date
    dim samd            ' today's date in format aaaammdd 
    dim URLPath         ' the directory where the files are
    dim URL             ' the name of the agenda file to open
    dim WshShell

    d = DateAdd ("h", 5, Date)            ' "today" lasts until 05:00 AM
    samd = Cstr(Year(d)) & Right("00" & Cstr(Month(d)), 2) & Right("00" & Cstr(Day(d)), 2) 
    ' WScript.Echo "samd v2: " & samd
    ' file:///C:/w/2014/agenda20140101.html
    URLPath = "C:\w\" & Cstr(Year(d)) + "\"
    URL = URLPath & "agenda" & samd & ".html"
    ' WScript.Echo "el URL es: " & URL
    Set WshShell = WScript.CreateObject ("WScript.Shell")
    WshShell.Run "C:\z\amaya\WindowsWX\bin\amaya.exe " & """" & URL & """", 1, False

