import re,sys
sys.path.insert(0,'gen')
from final import NEW
inv={v:k for k,v in NEW.items()}
src,dst=sys.argv[1],sys.argv[2]
s=open(src).read()
s=re.sub(r'/_blob/([0-9a-f]{32})',lambda x:'../../art/'+inv[x.group(1)]+'.jpg',s)
s=s.replace('<script src="./support.js"></script>','')
h=re.search(r'<helmet>(.*?)</helmet>',s,re.S).group(1)
s=s.replace('<helmet>'+h+'</helmet>','').replace('</head>',h+'</head>')
s=re.sub(r'<script type="text/x-dc".*?</script>','',s,flags=re.S)
ff='<style>@font-face{font-family:Sora;src:url(../Sora-Variable.woff2) format("woff2");font-weight:100 900}@font-face{font-family:"DM Sans";src:url(../DMSans-Variable.woff2) format("woff2");font-weight:100 1000}</style>'
s=re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>','',s).replace('</head>',ff+'</head>')
open(dst,'w').write(s)
