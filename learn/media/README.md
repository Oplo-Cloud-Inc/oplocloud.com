# Section video

`unit5.js` points 5.1 at `media/mediaart5_1.mp4`. The file is deliberately not
in the repository — it is 70MB, which is above GitHub's recommended file size
and would sit in the history permanently.

The reader does **not** mount a `<video>` element until it knows the file is
there. It probes the URL off-screen first, and only swaps the designed
placeholder for a real player once the browser has actually read the metadata.
So a missing file costs a reader a frame that explains itself, rather than a
broken control at the top of the article.

Two ways to make the video play:

1. **Drop the file in here.** Copy `mediaart5_1.mp4` into `learn/media/` on the
   server (or add it to the repo if you decide the size is acceptable). The
   probe finds it and the placeholder replaces itself on the next load.

2. **Point at a URL instead.** Set `video` in `learn/unit5.js` to an absolute
   URL — a CDN, S3, Cloudflare R2, wherever the file lives. Nothing else
   changes.
