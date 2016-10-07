# Video Ad Serving Template (VAST) JS Plugin for jwPlayer
Cross-platform, free and open-source VAST jwPlayer(without any License key).  This is an open source project made in [@clickyab](https://github.com/clickyab) team.

# Installation
    
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
                    file:  'http://cdn.jabeh.com/videos/e62d0e7d2779e9a9e38b4ab9eb27aa4c_240.jbh'  ,
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
