# dev.oplocloud.com — pictures and films

Every picture and film on the page is a slot in `dev/index.html`:

```html
<div class="dv-media" data-slot="Hero 1" data-size="2560 × 1440 · image or film"
     data-src="" data-alt=""></div>
```

Put the file in this folder and write its path into `data-src`, relative to
`dev/`:

```html
data-src="media/hero/os1.jpg"
```

- An image — `.jpg .png .webp .avif .gif` — is drawn as an image.
- A film — `.mp4 .webm .mov .m4v` — plays muted, looping and inline.
- `data-alt` is what a screen reader reads. Write it. An empty one marks the
  slot decorative, which is only true when the words beside it already say
  everything the picture says.
- `data-eager` turns lazy loading off. It belongs on the four hero slots and
  nowhere else.
- `data-film-src` is the film a card opens in the lightbox, which is a
  different file from the poster in `data-src`.

An empty `data-src` draws the slot's name and the size it wants, so the page
stays legible — and reviewable — before a single picture exists. Nothing
breaks while a slot is empty, and nothing needs changing but the one attribute
when it stops being.

`data-size` is a recommendation, not a constraint: a slot crops its file to
fill, except `.dv-bare` slots (the platform cards and the SDK mark), which fit
it inside and want a transparent PNG.

## The slots

| Slot | Size | Where |
| --- | --- | --- |
| `Hero 1`–`Hero 4` | 2560 × 1440 | the carousel at the top |
| `Film 1`–`Film 6` | 1600 × 900 | Latest films |
| `os` `studio` `silicon` `intelligence` `cloud` `edu` | 1200 × 900, transparent | Platforms |
| `sdk` | 512 × 512, transparent | the What-is-new card |
| `Downloads` `Support` | 1400 × 1050 | the two split rows |

Files here are served from `dev.oplocloud.com/media/…`. Keep them in
subfolders — `media/hero/`, `media/films/`, `media/platforms/` — so the page's
`data-src` says where a picture belongs as well as what it is.
