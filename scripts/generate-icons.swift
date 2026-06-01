// Render the link-mage toolbar and listing icons on macOS.
//
// Uses AppKit so the mage comes from a supplied PNG and the success/failure
// badges are drawn with Apple Color Emoji (the "mac icons" look). Invoked by
// scripts/generate-icons.sh; see there for the produced files.
//
// Usage: swift generate-icons.swift <source-mage.png> <output-dir>

import AppKit
import Foundation

func die(_ message: String) -> Never {
  FileHandle.standardError.write(Data("error: \(message)\n".utf8))
  exit(1)
}

let args = CommandLine.arguments
guard args.count == 3 else { die("usage: generate-icons.swift <source-mage.png> <output-dir>") }
let sourcePath = args[1]
let outDir = args[2]

guard let mage = NSImage(contentsOfFile: sourcePath) else { die("cannot load mage source: \(sourcePath)") }

// A fresh transparent RGBA bitmap of the given square pixel size.
func makeBitmap(_ size: Int) -> NSBitmapImageRep {
  guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
  ) else { die("cannot allocate \(size)x\(size) bitmap") }
  rep.size = NSSize(width: size, height: size)
  return rep
}

func writePNG(_ rep: NSBitmapImageRep, to path: String) {
  guard let data = rep.representation(using: .png, properties: [:]) else { die("cannot encode PNG: \(path)") }
  do { try data.write(to: URL(fileURLWithPath: path)) } catch { die("cannot write \(path): \(error)") }
}

// Render an emoji and crop it tight to its visible pixels, so it sits flush in
// the badge corner instead of carrying the font's line-height padding.
func emojiImage(_ emoji: String) -> NSImage {
  let fontSize: CGFloat = 256
  guard let font = NSFont(name: "Apple Color Emoji", size: fontSize) else { die("Apple Color Emoji font unavailable") }
  let string = NSAttributedString(string: emoji, attributes: [.font: font])
  let textSize = string.size()
  let w = Int(ceil(textSize.width)), h = Int(ceil(textSize.height))

  let rep = makeBitmap(max(w, h))
  rep.size = NSSize(width: w, height: h)
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  string.draw(at: .zero)
  NSGraphicsContext.restoreGraphicsState()

  // Alpha bounding box (bitmapData is top-left origin).
  guard let bytes = rep.bitmapData else { die("no bitmap data for emoji") }
  let bpr = rep.bytesPerRow, spp = rep.samplesPerPixel
  var minX = w, minY = h, maxX = -1, maxY = -1
  for y in 0..<h {
    for x in 0..<w where bytes[y * bpr + x * spp + 3] > 10 {
      minX = min(minX, x); maxX = max(maxX, x)
      minY = min(minY, y); maxY = max(maxY, y)
    }
  }
  guard maxX >= 0 else { die("emoji rendered empty") }
  let cw = maxX - minX + 1, ch = maxY - minY + 1

  let full = NSImage(size: NSSize(width: w, height: h))
  full.addRepresentation(rep)
  let cropped = NSImage(size: NSSize(width: cw, height: ch))
  cropped.lockFocus()
  // NSImage source rect is bottom-left origin, so flip the y of the box.
  full.draw(
    in: NSRect(x: 0, y: 0, width: cw, height: ch),
    from: NSRect(x: minX, y: h - maxY - 1, width: cw, height: ch),
    operation: .copy, fraction: 1.0
  )
  cropped.unlockFocus()
  return cropped
}

// Mage scaled to `size`, with an optional emoji badge anchored bottom-right.
func compose(size: Int, badge: NSImage?) -> NSBitmapImageRep {
  let rep = makeBitmap(size)
  NSGraphicsContext.saveGraphicsState()
  let ctx = NSGraphicsContext(bitmapImageRep: rep)
  NSGraphicsContext.current = ctx
  ctx?.imageInterpolation = .high

  let square = NSRect(x: 0, y: 0, width: size, height: size)
  mage.draw(in: square, from: .zero, operation: .sourceOver, fraction: 1.0)

  if let badge = badge {
    // Match the original layout: badge ~22/48 of the icon, flush bottom-right.
    let target = CGFloat(size) * 22.0 / 48.0
    let b = badge.size
    let scale = target / max(b.width, b.height)
    let bw = b.width * scale, bh = b.height * scale
    let dst = NSRect(x: CGFloat(size) - bw, y: 0, width: bw, height: bh)
    badge.draw(in: dst, from: .zero, operation: .sourceOver, fraction: 1.0)
  }

  NSGraphicsContext.restoreGraphicsState()
  return rep
}

let check = emojiImage("✅")
let cross = emojiImage("❌")

writePNG(compose(size: 48, badge: nil), to: "\(outDir)/icon-default.png")
writePNG(compose(size: 96, badge: nil), to: "\(outDir)/icon-default-96.png")
writePNG(compose(size: 128, badge: nil), to: "\(outDir)/icon-default-128.png")
writePNG(compose(size: 48, badge: check), to: "\(outDir)/icon-active.png")
writePNG(compose(size: 48, badge: cross), to: "\(outDir)/icon-fail.png")
