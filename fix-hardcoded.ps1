$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | Where-Object { $_.FullName -notmatch "store\.ts|mock-data\.ts|api\.ts" }

foreach ($file in $files) {
    $c = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $orig = $c

    # Fix remaining useState defaults
    $c = $c.Replace('useState("Metromindz Store - India', 'useState("')
    $c = $c.Replace('useState("Metromindz', 'useState("')

    # Fix remaining fallback display values
    $c = $c.Replace('|| "Metromindz Store - Premium E-Commerce"', '|| "Store"')
    $c = $c.Replace('|| "Metromindz Store"', '|| "Store"')
    $c = $c.Replace('|| "Metromindz"', '|| ""')

    # Fix remaining placeholders
    $c = $c.Replace('placeholder="Metromindz Store - Pre', 'placeholder="Store - Pre')
    $c = $c.Replace('placeholder="e.g. Metromindz Store"', 'placeholder="e.g. Your Store Name"')
    $c = $c.Replace('placeholder="e.g. Metromindz E-Commerce', 'placeholder="e.g. Your Company')
    $c = $c.Replace('placeholder="e.g. Metromindz / Sony', 'placeholder="e.g. Your Brand / Sony')
    $c = $c.Replace('placeholder="e.g. ? Metromindz Flagship', 'placeholder="e.g. ? Flagship')
    $c = $c.Replace('placeholder="e.g. Metromindz', 'placeholder="e.g. Your')

    # Fix remaining inline display
    $c = $c.Replace('{config.siteTitle || "Metromindz Store - Premium E-Commerce"}', '{config.siteTitle || "Store"}')
    $c = $c.Replace('{section.content.bannerBadge || "? Metromindz Flagship Series"}', '{section.content.bannerBadge || "? Flagship Series"}')

    # Fix admin dashboard hardcoded email display
    $c = $c.Replace('"customer@metromindz.com"', '"customer@store.local"')
    $c = $c.Replace('"customer@me', '"customer@store.local"')

    if ($c -ne $orig) {
        [System.IO.File]::WriteAllText($file.FullName, $c, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed: $($file.Name) ($($file.FullName))"
    }
}
Write-Host "Done."
