Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Gabri\.gemini\antigravity-ide\brain\99b6ef24-4da3-4e89-a92d-fe60b0620075\avatar_fullbody_1787062062372.jpg"
$destPath4K = "c:\Users\Gabri\Desktop\My Type\Index\avatar_fundo_branco_4K.png"
$destPath = "c:\Users\Gabri\Desktop\My Type\Index\avatar_fundo_branco.png"

$targetW = 2160
$targetH = 3840

$srcBmp = [System.Drawing.Bitmap]::new($srcPath)
$upscaled = [System.Drawing.Bitmap]::new($targetW, $targetH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($upscaled)

$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($srcBmp, 0, 0, $targetW, $targetH)
$g.Dispose()
$srcBmp.Dispose()

# Advanced Unsharp Masking Kernel (Sharpen 3x3)
$sharpened = [System.Drawing.Bitmap]::new($targetW, $targetH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$rect = [System.Drawing.Rectangle]::new(0, 0, $targetW, $targetH)

$inData = $upscaled.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$outData = $sharpened.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$stride = $inData.Stride
$numBytes = $stride * $targetH
[byte[]]$inBuf = New-Object byte[] $numBytes
[byte[]]$outBuf = New-Object byte[] $numBytes

[System.Runtime.InteropServices.Marshal]::Copy($inData.Scan0, $inBuf, 0, $numBytes)

# Copy whole buffer first
[Array]::Copy($inBuf, $outBuf, $numBytes)

# Unsharp kernel: Center 5.0, Neighbors -0.75, Diagonals -0.25 (Amount: 0.35)
$amount = 0.45

for ($y = 1; $y -lt ($targetH - 1); $y++) {
    $rowIdx = $y * $stride
    $rowAbove = ($y - 1) * $stride
    $rowBelow = ($y + 1) * $stride

    for ($x = 1; $x -lt ($targetW - 1); $x++) {
        $idx = $rowIdx + ($x * 4)

        for ($c = 0; $c -lt 3; $c++) { # B, G, R
            $center = [double]$inBuf[$idx + $c]
            
            $up    = [double]$inBuf[$rowAbove + ($x * 4) + $c]
            $down  = [double]$inBuf[$rowBelow + ($x * 4) + $c]
            $left  = [double]$inBuf[$rowIdx + (($x - 1) * 4) + $c]
            $right = [double]$inBuf[$rowIdx + (($x + 1) * 4) + $c]

            $laplacian = ($center * 4.0) - ($up + $down + $left + $right)
            $sharpenedVal = $center + ($laplacian * $amount)

            if ($sharpenedVal -gt 255.0) { $sharpenedVal = 255.0 }
            if ($sharpenedVal -lt 0.0) { $sharpenedVal = 0.0 }

            $outBuf[$idx + $c] = [byte]$sharpenedVal
        }
        $outBuf[$idx + 3] = 255
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($outBuf, 0, $outData.Scan0, $numBytes)

$upscaled.UnlockBits($inData)
$sharpened.UnlockBits($outData)
$upscaled.Dispose()

$sharpened.Save($destPath4K, [System.Drawing.Imaging.ImageFormat]::Png)
$sharpened.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$sharpened.Dispose()

Write-Host "Ultra-sharp 4K PNG saved successfully at $destPath4K"
