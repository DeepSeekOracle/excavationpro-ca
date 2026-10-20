LYGO Local — per-user installer
================================

This is a one-time, per-user setup. It does not need administrator rights.
It installs the LYGO Connect harness into:

  %LOCALAPPDATA%\LYGO\

Files written:

  lygo-connect.exe
  LYGO-Local-Uninstall.exe
  LYGO-Local-CodeSigning.cer
  README.txt

No Windows service, driver, firewall rule, or startup entry is created.
The installer creates a Start Menu shortcut and launches LYGO Connect.
You can remove it later by running LYGO-Local-Uninstall.exe in the install folder
(or delete %LOCALAPPDATA%\LYGO and the shortcut).

Signing
-------
The harness and installer are signed with the LYGO Local self-signed
code-signing certificate in this download. Windows may show
"Unknown publisher" because the certificate is not issued by a public CA.

If you trust the source, you can install the certificate into your user
Trusted Publishers/Trusted Root store; otherwise use "More info" and
"Run anyway" only after verifying the SHA-256 on the download page.

SHA-256 and certificate are published beside this file.

Privacy
-------
Prompts go only to the local engine you select. LYGO Connect does not send
prompts to excavationpro.ca. The public relay is opt-in via a pairing code.

Terms and privacy:
  https://excavationpro.ca/portal/local/terms.html
  https://excavationpro.ca/portal/local/privacy.html
