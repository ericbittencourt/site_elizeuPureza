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

  # API: upload de arquivos para assets
  if ($req.Url.AbsolutePath -eq '/api/upload' -and $req.HttpMethod -eq 'POST') {
    try {
      $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
      $json = $reader.ReadToEnd()
      $obj = ConvertFrom-Json $json
      $name = [string]$obj.name
      $data = [string]$obj.data
      if ([string]::IsNullOrWhiteSpace($data)) { throw 'no_data' }

      # data pode vir como data URI: "data:...;base64,<conteudo>"
      if ($data.Contains(',')) { $data = $data.Split(',')[1] }

      $bytes = [Convert]::FromBase64String($data)
      $assetsDir = Join-Path $root 'assets'
      if (-not (Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir | Out-Null }

      # sanitizar nome e gerar único
      $safeName = [System.IO.Path]::GetFileName($name)
      if ([string]::IsNullOrWhiteSpace($safeName)) { $safeName = 'upload.bin' }
      $ext = [System.IO.Path]::GetExtension($safeName)
      if ([string]::IsNullOrWhiteSpace($ext)) { $ext = '.bin' }
      $base = [System.IO.Path]::GetFileNameWithoutExtension($safeName)
      $unique = "$([DateTime]::UtcNow.ToString('yyyyMMdd_HHmmss'))_$([Guid]::NewGuid().ToString().Substring(0,8))"
      $finalName = "$base-$unique$ext"
      $outPath = Join-Path $assetsDir $finalName
      [System.IO.File]::WriteAllBytes($outPath, $bytes)

      $ctx.Response.ContentType = 'application/json'
      $resp = '{"ok":true,"url":"/assets/' + $finalName + '"}'
      $buf = [System.Text.Encoding]::UTF8.GetBytes($resp)
      $ctx.Response.StatusCode = 200
      $ctx.Response.OutputStream.Write($buf, 0, $buf.Length)
    } catch {
      $ctx.Response.ContentType = 'application/json'
      $resp = [System.Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"upload_failed"}')
      $ctx.Response.StatusCode = 400
      $ctx.Response.OutputStream.Write($resp, 0, $resp.Length)
    }
    $ctx.Response.Close()
    continue
  }
  # API: persistência do portfólio
  if ($req.Url.AbsolutePath -eq '/api/portfolio') {
    try {
      $filePath = Join-Path $root 'assets/portfolio.json'
      if (-not (Test-Path $filePath)) { [System.IO.File]::WriteAllText($filePath, '[]') }

      if ($req.HttpMethod -eq 'GET') {
        $ctx.Response.ContentType = 'application/json'
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $ctx.Response.StatusCode = 200
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      } elseif ($req.HttpMethod -eq 'POST') {
        $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
        $json = $reader.ReadToEnd()
        try {
          $null = ConvertFrom-Json $json
          [System.IO.File]::WriteAllText($filePath, $json)
          $ctx.Response.ContentType = 'application/json'
          $resp = [System.Text.Encoding]::UTF8.GetBytes('{"ok":true}')
          $ctx.Response.StatusCode = 200
          $ctx.Response.OutputStream.Write($resp, 0, $resp.Length)
        } catch {
          $ctx.Response.ContentType = 'application/json'
          $resp = [System.Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"invalid_json"}')
          $ctx.Response.StatusCode = 400
          $ctx.Response.OutputStream.Write($resp, 0, $resp.Length)
        }
      } else {
        $ctx.Response.StatusCode = 405
        $msg = [System.Text.Encoding]::UTF8.GetBytes('Method Not Allowed')
        $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
      }
    } catch {
      $ctx.Response.StatusCode = 500
      $msg = [System.Text.Encoding]::UTF8.GetBytes('Internal Server Error')
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $ctx.Response.Close()
    continue
  }
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