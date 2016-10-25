# Video Ad Serving Template (VAST) JS Plugin for jwPlayer (Beta)
## without any License key
<a target="_blank" href="https://camo.githubusercontent.com/3f3ead5def54346308bb4604debc31c039c85cb5/687474703a2f2f7777772e6a77706c617965722e636f6d2f77702d636f6e74656e742f75706c6f6164732f4a57502d4769744875622d42616e6e65722d312e706e67"><img height="70px" style="max-width:100%;" data-canonical-src="http://www.jwplayer.com/wp-content/uploads/JWP-GitHub-Banner-1.png" title="JW Player Logo" alt="JW Player Logo" src="https://camo.githubusercontent.com/3f3ead5def54346308bb4604debc31c039c85cb5/687474703a2f2f7777772e6a77706c617965722e636f6d2f77702d636f6e74656e742f75706c6f6164732f4a57502d4769744875622d42616e6e65722d312e706e67"></a>
### VAST/VPAID Advertising For The Most Popular HTML5 Player And Video Platform
<br>
Cross-platform, free and open-source VAST jwPlayer.  This is an open source project made in [@clickyab](https://github.com/clickyab) team.

# Demo
    [Demo Page](http://miladheydari.ir/vast-jwplayer/)

# Installation
<pre>
<code>
    $ git clone git@github.com:clickyab/clickyab-vast-jwplayer.git
</code>
</pre>
    
# Usage
<ul>
<li>clone the project</li>
<li>call jwplayer and config it</li>
<li>upload vastAD.js to your server</li>
<li>Enjoy it :)</li>
</ul>

```javascript
<script type="text/javascript">
    var playerInstance = jwplayer("video");
    playerInstance.setup({
        aspectratio: "16:9",
        stretching:'uniform',
        playlist: [{
            sources: [
               
                {
                    file:  'http://example.com/video.mp4'  ,
                    label: '240',
                    type:"video/mp4"
                    ,"default": "true"
                }

            ],
            title: "Your Video Title",
            description: "Your Video Description",
            image: "Your Video Poster"
        }],
        plugins: {
            "http://example.com/vastAD.js": {},
        }
        ,advertising:{
            client:"vast",
            schedule:"http://v.clickyab.com/ads/vast.php?a={clickyab_id}&l={video_duration}&RandomNumber",
        }
        primary: "html5",
    });
</script>
```
<ul>
<li>clickyab_id is your id number in clickyab. example : 2081450003094</li>
<li>video_duration in second unit (automatically Generate AD According to video Duration) </li>
</ul>

# Note
    ES6 Version and NPM Package coming soon :)

## License
    The MIT License (MIT)
    (C) 2016 - clickyab.com 

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the “Software”), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
