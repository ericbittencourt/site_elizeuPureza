$ErrorActionPreference = 'Stop'
$root = Get-Location
$prefix = 'http://localhost:5500/'

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Static server running at $prefix"

while ($true) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request

  $relPath = $req.Url.AbsolutePath.TrimStart('/')
  if ([string]::IsNullOrWhiteSpace($relPath)) { $relPath = 'index.html' }
  $fullPath = Join-Path $root $relPath
  if (-not (Test-Path $fullPath)) {
    $fullPath = Join-Path $root 'index.html'
  }

  $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
  switch ($ext) {
    '.html' { $ctx.Response.ContentType = 'text/html' }
    '.css'  { $ctx.Response.ContentType = 'text/css' }
    '.js'   { $ctx.Response.ContentType = 'application/javascript' }
    '.png'  { $ctx.Response.ContentType = 'image/png' }
    '.jpg'  { $ctx.Response.ContentType = 'image/jpeg' }
    '.jpeg' { $ctx.Response.ContentType = 'image/jpeg' }
    '.svg'  { $ctx.Response.ContentType = 'image/svg+xml' }
    '.webp' { $ctx.Response.ContentType = 'image/webp' }
    '.mp4'  { $ctx.Response.ContentType = 'video/mp4' }
    '.webm' { $ctx.Response.ContentType = 'video/webm' }
    '.ogv'  { $ctx.Response.ContentType = 'video/ogg' }
    '.mp3'  { $ctx.Response.ContentType = 'audio/mpeg' }
    '.wav'  { $ctx.Response.ContentType = 'audio/wav' }
    default { $ctx.Response.ContentType = 'application/octet-stream' }
  }

  try {
    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $ctx.Response.StatusCode = 200
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    $ctx.Response.StatusCode = 500
    $msg = [System.Text.Encoding]::UTF8.GetBytes("Internal Server Error")
    $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
  }
  $ctx.Response.Close()
}