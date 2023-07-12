# HTTP Live Streaming support

HTTP Live Streaming (also known as HLS) is an HTTP-based adaptive bitrate streaming communications protocol developed 
by Apple. It works by breaking the overall stream into a sequence of small files. A list of available "streams", encoded
at different bit rates, is described int a separate extended M3U playlist.

RYSK libraries utilizes two simultaneous data transports: videodata and SYK/RYSK data. Currently HLS support is only
implemented with the video since this is what HLS was developed for. However, there is an ongoing effort to provide
a similar technique for adaptive download of SYK/RYSK data as well. As of the current version, only the first steps
have been taken towards this goal which will be described in the [Data](#data) chapter.

## Video

``VideoElement`` from ``@mantisvision/utils`` has HLS support which is then by proxy available for users of 
``@mantisvision/rysk``, ``@mantisvision/ryskurl``, ``@mantisvision/ryskthreejs``, ``@mantisvision/ryskplaycanvas``, 
``@mantisvision/ryskaframe`` and ``@mantisvision/ryskunity3d``.

The .m3u HLS playlist must be passed to the constructors instead of the direct video URL. Safari uses its native support
for HLS, on the other browsers [hls.js](https://github.com/video-dev/hls.js/) library is used instead. The library
allows to register callbacks for multiple events (see its documentation). Use ``onHlsEvent``, ``offHlsEvent`` or 
``onceHlsEvent`` methods of the ``VideoElement``, ``RYSKUrl`` or ``URLMesh`` objects based on the library you're using.
However, those events won't get triggered on Safari and an exception might be thrown instead.

## Data

Support for the SYK/RYSK variant of HLS is currently "work in progress". As of now, a .syk file can be fragmented into
multiple smaller files each containing volumetric data only for certain frames. These files are described in a JSON manifest
file in a similar way to m3u file for mp4 segments. The JSON format is as follows:
```
[{
  "quality": integer,
  "version": string,
  "baseUrl": string,
  "data": [[integer,string],[integer,string],...]
},...]
```
The root element is an array which contains one object per one "quality" of data. 

``quality`` property of the object is its quality's
numeric representation with lower numbers being inferior quality to higher numbers. In the current version, however, other
elements of the root array are currently not considered when downloading the data since HLS support for RYSK data hasn't
been implemented yet.

``version`` property describes the version of SYK/RYSK data format; currently either SYK0, SYK1, RYS0 or RYS1.

``baseUrl`` points towards part of the path which all .syk files share. If it's a relative URL, than it's relative to
the URL of the manifest file,

``data`` field is an array containing tuples; a two element arrays of which the first element is the number of the first frame
in a single split SYK/RYSK data file. The second element contains the path to that single split file. The path is 
relative to the baseUrl property. Bear in mind that the first RYSK data in each split SYK/RYSK data file must be a keyframe,
otherwise the decoding fails. The split files also shouldn't contain 4 byte identification of the file's format version (e.g.
RYS0, SYK0 etc) since that one is already specified by the ``version`` property.

The only current advantage of having SYK/RYSK data in multiple files is a faster jumping to a specific timestamp, as
the RYSKDownloader doesn't need to download one big file to reach the desired frame, but only a portion of a smaller one.
However, even this advantage is questionable as a majority of modern HTTP servers support "range" header which
``@mantisvision/rysk*`` libraries can utilize in two ways:
1. RYS1 data file format contains a map akin to mp4 MOOV atom
2. RYS0 and older file formats can be used with the very similar manifest file as described above. The only difference is
that instead of ``[integer,string]`` tuple, the data array contains ``[integer,integer]`` tuple where the first element is
a frame number as before and the second is its offset in bytes from the beginning of the file.
