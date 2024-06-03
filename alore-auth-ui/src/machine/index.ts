import { State, assign, createMachine, interpret } from 'xstate';
import {
  AuthMachineContext,
  AuthMachineEvents,
  AuthMachineServices,
} from './types';
import Cookies from 'js-cookie';

const initialContext: AuthMachineContext = {
  salt: undefined,
  error: undefined,
  active2fa: undefined,
  registerUser: undefined,
  googleOtpCode: undefined,
  googleUser: undefined,
  sessionUser: undefined,
  forgeData: undefined,
  CCRPublicKey: undefined,
  RCRPublicKey: undefined,
};

export const authMachine = createMachine(
  {
    /** #no-spell-check @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBGACwA2bQDoArACYjAZgDsRgQA5tp6+YA0IAJ6JTR9XtPGAnL6NrdT9tIwBfMOc0LFwCEjA9EnxZADdyAEl2dPp0gEEAGXSALSpBESQQSWlZeUUVBA0BbS91a19TdW0DAU1fcw9nNwQDXT1W8wFTAItA+wiojBx8IlJE4mTCNLJM7LzCkr51cvEpGTkFCvrVX3VzPXNzXwEn8xH2o0HETX69Iz6PARafoTXwGeYgaJLOKrDZbah0fjCRRVM61S5qdRNTS-EE3HSaaymGyfBrqeyGIyaQGaVoeayU8KRCGLWIrBKw8g0dIAcXYjAAqgAFMrI041C6geqWbFPHoBHrBYwfVxqR56LrmKndUGYymmcGQ1nxPQcsj5VjczIiioo8V1dy+bFUwJtAzGczaTSUkmaAx6TQeP7WAxaawOWwGlnLY2mgBirAo3NYTEFuRoNAA6gmACLWk7Vc724ZkvSg0xEtraIK3Xwk1Q+f0GTS9QJdIzaR3aSMxaMwvCpBIAdzAACNTMx5KR+xIAE56PCTsD9khQMhsdix9IUbCMDNUABCpkY5st7DzlTFhfRCD+ll+tnUJj+7W0mpJ9NMv3U4wDj6pQW7KE2RNZc0j0YcxwnYgp3QWc9DAABbZBCAAG3SYgxAwMgADUqAodJYwATUYKhsFydJ8hIwpLX3CjskI89bSvSVED+V972aJ9-FMV9NBJB4-U8H8OkpGx1EAo0+wHcDR3HRdpznNIZ0IAAzFwVyoJDUKoFDCCgQgR1QmQXDICB5ASEgUgkABrdko2hdlQKHWSoJguClNU9TiCgTTkJQnS9IMoz0BcBBLIkPBkHFMpGMvNEWIQCsnQMR4+mfHi3xVBB2k-cxvwcX9RIAplDV7RzpIguToKXWDFLAZS1I0rT-N0-TDN0kKyHqmc4LEFCopU2cEJNezgI5GTIPk2q9A8xrvN87TWqCjrQvCyLouEWKC3i5R3BsZLUssbjeJJbiv2Ev8BEeCSypAiqXKmuDEL8owVOQCcIHIXD8KIlh8nIncNyYUjyMooxY1yLbUQlXab18No9CCYETGOzKhkxYx7nyzURKpa6StGmMnImqq3LqhqvKgZh+sIBD2BU9AFpQ17kFM8y1is2yRp7By7s2ZzJuqhSZvqzyV2p5C6YZpmWbC4grPW84YqRG04ph+oOkBRHAU1I6XzRxBv2Cc6Ctxq7fBu3nxsq1yavc0W5qpmmpcZ5qWa6mcernPqBqG7mgKJ+7BbJkWKfF536ddl63rlhWoqVzaVfzaGi01rxrB1750pOrLv01LGLtE-GFh5sbiZtx650ICAUM5Kh8ioZgmHXdhG-oBMobta92z6QxXmCIkbkmdR33Y3xQimSZdHbNpLbL6SUIkfTiDIBEhUYahLRoLgKAFOgKE75jYame43lsZ9XipHoSTMLQxk1JssQfwk58D-m9EX5fEhr8hW94Q+doay9BSAwUx+jBkxJYG+Ew7iPGeJWAwARx6aFflJd+n8SDf1rmaC0mRdzZAABK7gPOODgrcm4dyTheba6tDbj39ASIwbpbgdEJAYEkNZPwOCJMEZogI-yoPKugpemDq7YKTBaBux5cFnioUxQBrF2L2AcOPJoECbg3wfOdHwzQ7AehSoIvmYEMHECweQXI2ZsK5HYMwKgjB26MFTOmLMFBcxyLVkWGkdwbg3D8D0AQfwb4pSMN4JookLBhlAYY8aJi9AzjAOgZSYAUgrhoMgFC6A2arHClzUqVtiaxPiYkwgyTUnpPQLHCK8d5DK2ONQlO14Hi+G8L0TUzZ2iPGCDfJ4zSLC3HbHYII5YuwE1Lm-YxIjTFFKSSk7yaSMkey9noH26BBozmGnk+ewiv7TJKbMqA8yKlrWqcQWpooaFFnrPoSwwR+gdg9D0Zo3TjaeCbOPMBAZJjRIKZMtYmF0CCmQLAWAg5ZwQDIPuXIzAADSADaEIAJNc6wAZx7NH+ICG+dgBClgCXlPKr4bAOG+QvX5JB-mAuBaCmc4K2DYEFA3LgjAJHcikVyXkjArTuIudeNodx2wovaAEQIrQSSsP0KELOKiBABJ0MS7ZoiMIYApSCsFOE8IEWIieTldT5HwsfAIQSYZzCElMDoRUyohhGDxXoZ4jppisM1HKiZX9ZqU3yJMrJFl5Y2TsmMtBzrMGupXO65elTFY1MTjqjx15aR+l0HimwE8+h8Syvyv0V0QSvCtZMAxoyA7+oSLEoN3kQ0kE9RzH1-tJJCIDaY4tUBS3EDDScmKRxzkNISrSLwboBnfmeKa8s0CT6PF6BnXF3R6ROsLb8+tjby05N9fmmt06XUOzdZM5tG0hB8CMFG7lnbCTduMLoPt7QAymE0c2RGKUCTSqtROxkJcl1GJXYGtdwaPVmWyd63JhMC0fxne+ktG7jlbr4KYPdHbYatCvYEVsHQyQY1Ffw+4ui-hEn6DoqdAHV1h2A8vRZvV+qrL9ps8Zr661AYbSB714bTmRvbV3BKjw7ieitR0XobozU3xpNinohIM26huPqPN1aX04cwbACQDNBzIHie7dcm5tyMEzCwVg2ZShcqg-UL0joxgGAzhMHiNIaSYpMIYAJuhmwWH7th2JUmZNybAO7fkdBGAENyK4jMnm7Hg0hlppjx8Ah3CbJ0XFryCQXtTTSfQwzKR5VYT4OzvyHPoFk-Jt6EKoWwoC0feo-LrA2qujWZsVrQRBIcGMYTAQ+HtDdMl3DYtvIsw+uQL9XrOaLrEzEwDeGoAtYkJ9TdCdt25YUcMGVvxPCTAzvSN4QTQHeFvkZuk6gLaiduj1xrjsBufXnT+rrm2fnbcprtsAw2I3brbarfdsNugeC-JrfovRTWYqeIjAIoDeiTA6Q1t9fWzuEe9sRtZGy-3Lok5RgHb1WsXfo6NyDgWdNBlQ5SZsHpmjIugdKizGdRI9AsM2P7pjMByYgOl5zmXXN2JoKwWM9BvPUEYH5uFqcAiFfuUjUBpqnCptAV4A1vRvigmMB4YnehSfUop+7b6Gr3MZkYLkfk9ACGs+vLp8V2hnghmbG6YwN9PCa+-DSHpWgRlPu68dzBkvydOfdpCmFavO2PH0GYEEVhpVNjygbv4hhEHtjW+WNoPRxekEHNmUpeByCKa3DuDT2F0i2LUxpp3d2JghOeF0XQnpE3WGgUEbwrQDXsaeI+5kfqIexLDxHlJUfKC0CoOwbMyfNOI7y4gEM9CAnSvLPYY1XpunljGCijOWh-CgnF-W1r+3OtVqOySk74tBvndAyN1P9RQiUn9JqQI3QDNUhTZaj0n52xfd3wZ+5k+qPT+6kR326y5-5IX-9prVNl9w7OTd7THeJheF16EOwJBHQTRK1f0J8dsJhZFcXeJWAMAYgCAJfYgFSQgdZE5JmGfStMjf9QpOAOAhA7yKCZA1A8UJmD-BjL-JHDvHoO4QEHwG4b8PpdhVNfwPjGkB8bvQMFBDbJ-eVUxZ6VCd2eERvZvNgFPMbeFewTwdUF7WwB4QXPPLKOkbFF8YwBgsrX0cXfg5mTLWXX6EGCiZnCGdfL4GwWBLQAzKYG4TUBQoYDjbFZFN0DoY1aVXQTQt2TLB3HLNvcbCA5pA1MSK1dsPvUVYIbFGkFKY1LtPKK-PrGWTLdrCtX9CvcTItKjOI5AMghHRjdvBFdobFOwc9RhKwbQEI0YeNB4LXHpQEGI1-dIoHZZEHUjcHFI3rWo9wjI1fS7YwhFZ4bFJsYoykDUK6ZDb8VDTodDK6csEYaA3A+ApqPyafBIhdR-LZWtOJWY-AnyZqWHTo+HboywkJDOZoTEJ4U1EYUVJhZpXED0WwUvMvLAyvVox2AhQcXIRYDApI59LbF-Z414xYTI7o-owrbNEYQAykLHVNN3dUZNYwWwKsIIc3cvL4q3KHV-F4t4rAD4w7HgtY+tdE-43Y1tbw+FLXLWAJNbEMfaPGA3CwaEh+VseEzoGo34jEzAeolZUHFY8jSHUONEv4rAAE8QzxK1O4NoGeYMCwHiEo1NcsEJFKFKTELoMkSdbg1YijPQFSBJaEKAWMWcGAbMKKVmJYg7Lk7A35TU9AbU3UmcfUw0wU4ky5cYnELoY9bofaKsIJfwf0LXfEF0AkcXC0q0vUsAA09AVmW-YHe-MHZI740xQMlYHU4M0Mjo2jFtcg5OSg0kK6UsQIXjQkJ4NoMMIJXoCkJBEE8fZkymbkCQJeWuOdY02fB4loxfbyas2ssARte07I8bVoEMU+EESYSzCwUVESOkpoY4rQK1SslcNsqAOsj1CMhoqM00x4lsqAWc+c0NQk9M+pTM10e8V4OErXFKYcxQ1ha9ZoKYKkeGWYcXKAGsucjsz9dmZYps2MvQe89szs7crIignIswQSPRflLxRBUIEIn4J4eE-tJoHiO8h8zcstBszA5o98z8x8781MsDa7DMnI0kwwQkE3U-ekb4cCz8F4LEGecYe4lClEj8+Cp8gjRcjkpomM2itChCptH87o+sZpAkNbW4CYfoqsXQZDWkx0S+eLRBekREt82i3ZUpbyCgZgCgLElc5szBeS-ZJSigLsv8nwhGTUJoW4XQR5MkUVU4v3V8ewW4IIKA1U7knA4pBSqAbS9kxoh-WS5-KZBJGZFcbS3SnC8bDwbEV8EwXoOwLjXnIYK+DnU1WwJw2yrgi3efXggDSKFCGgPSYgZgeJT6YgWQdJMgTcLIGgIhJxGgaFKgTVGRbo4MPonwYyzUUEO9cygJG1EYeLdjSA8XRedKzKqAbK3KuAgqlCLLR3IUxpGkUsdpJpYzD0WsRQ-oP0UELofhMkCwA1acxSsAfSWAdAeqQUVAEcXSPAaFMAFwHKyAYawgQqpCz4y3Ly3kx2CgHawgPag6o6k6s6i6oa-Km6lCAK3cnIzoEYP3BwKwazBDVqz8N0CYc9UBceMEeys0tcl63a-amcQ646wgU686y6vKka1Szy1K+tNGt6jGrGr6vG36kagE7CoGnstjbwAEHwcG-wCE6Kz3G1fwboYVTPcSZG1cn4ymMm96zGz6nG76-G6626l8k04m3EqjUWimiW3Gn6q6v69JAE3dbsvVNsf0YZRBf8YIEirKf8ZpRBeBCYGVcEraly16sWymyW6mjWwmu67EtUnk0mh2lW7GtW6WzWgGriiDXWosToD0CzCJMMSzWwH0W4bFKYaeSkRU14O25Wj6v2qWmm-6ty5chW9U729GjOqm9Wgm-6wG3VMOjsbEMwIIgAtoHQBa2w4MP0WGgnHwROpG5KnE9UkxbABJTAQbGgMAWuZceQVeeuNuRxNMTMHMbo1FA2zoXlDsLofwUVJsT8NbHvTPOEonQW9S0xPugeoekemqc4VeegTzFMGeyq6q08bo8zfvNu3srQMkaU2w41C2okZsc9YIBwcwHqyZfurAE+0e8UMarw0OmNIke4KYR8R8HnYow-dwAMEJDwDsE81oDGLupEh69+eJIuquH+VeAhVgBXHebAGgRgbAdTAoB+2kFpGy1sIIC-OsR8PTFwpUwEEMF3bDAh8m+qMxCepvDeKgLeegCgXIHIDgEiMiCibotbMMUJYzc1M3OsJGUsZFKsASz0YLPhn2wRsRcxSxaxJPBxcqlxNxB07uPvG1EwNhDjb4EeLKVQEYQrR0Q9MMUfGLfRwhoRrVPkDMQhYhQ8FuNuShaxhKKwTGGrWwUdEYJoKKw2akMAjpSkt0K6XxgRoh7BNeQUUR8RvCPePCBR9m-0E1TEWwBUx0Nhj3MAuGjsA1f4awLJsWoR5lKRAJh+gdMYKwUEG4ekaVJJ0kfpX4HnFsBEqS1pjGvQDGhCWAbAQbQq5gc0NzChqhmh7MOhiaqJ3hD7A1Y1XRm5d+jEMwbEZ7QkDODoQVHB-O9Yvx2AuY+aZqImmi6Sfhtpx5zY0grinZ2GP4TEMYU1ISK6dsDFFx3QQrR4TwPoNKcsB4aZwRr5+Y1CXOkjDyt5-BgxucZF55vyCu6NTtRp700EY1WwYMNKOseGDnF7OwM3ZFL5fe8aD5mZrQ7CdJauE5NVH6YifQ-IfYiGzR0ChBzoQMKlmB-aHGIXYMWeJl4mFlwRtljliALlzwh+30LwfuVKCU8ePodRh7LXD3KYDJkMETbuz2hVucJV3SFV8BoQkR0Q1vKBhKIkCV7+sJF7V5NhrmgClKCBAqdsRF8mNovyV51i957Fp6ymH5zCtfP5jWfM34c9B+GwcfKLIYa4IfbPFKT7JxgW817ky1qNlF0api9y6M5EiNvx+tGNuOMDeNlBu+YF6JxFW5E5hoJpRGD3PoXiAZpK3BlKsCItvAeJKKMAZVKlGlVgOlBlOxTedIbeSR6R2RSJ2GH+lodoYMACzoAMcVv0ToIYwlbidbAt-9Yd0d-aid1VTw+xVgDlbMBubo8I5pJhCAphxBJgjN-VVuthL0OUS86i8NrFvxkdsAMdq96lCB-Y9pLGdPZFUEK1b1mJ3QKSiAgkb4IN+cCQBCPqBJPyn2mcLl92tS5lyNhcHD2uWQba9Gwj8UAl27HTMpokbRkwbN5xjNnKdUFD+u18UlzD8j3Dqj+2mjrlstvOzFodsj7DwT-DkTuj351dnTTUfQcecYr0cMHiNhvOG1fimrceZTlpuVqt7J9Y3F4T8m2j84dA4ju5otmAvA2TiztA5qej7-G8SwWBZoawmy7hKlroHMsrW8De25iThIIt9ihixCuWxs0L+5kziLjCutuNxT9wcYdUX16OweWOlx78TGa2psNsWgkLoDyTvxhL5879GLkrsLyN8rrc2Nro+myu68VhXpXV9pZFZ8Wpq9QkTqyA+KmS2L8L+iudMT9FitvB0r+LkbmjJLrohtm8Zsa5Y11ReLLoLTswFpVQ6kGC8sTDzS8WZSsNyt4Dkzg7gg5S1zzMmkR8RGY-ck+U17XOQF8Z0BQEYeR5fbnyvZQ7lSsbzk2zyN87qmS7hT51oLfOXfGrLxaeOsU-UsV4UEgJabYMTD3q9Jfq4gFcZVWyFwdOmcIqnYUq6e9MW+gphdneJ9vGdUJaroL0UIYYlxjnXRGzaw-oJhQb6ruLtp9HjKrK7HoFWAXH-HqDhbniZFG1Kp01F8Zj9tgCsYY4-EXr7XTnk7qbz5hz7yJ2vAAOt26L5Crnotsz7X3X8usHvS+Fb4HQe4dsfREYdpN0Nht0KbA-LxrXcMfNgdnu7nmZ431W03wq-7litXmrh5zXqAE37OrW83wKy3gebwB5FFJqputQUAuLLhy430YrkPn3wRy14BweiAYesB8+ugBuJuEn2e1xJ9yYT8XoDGZBfoR5PdhX3QewLoZj41L7whgv0Bs+8e7eK+yvsn+d7eEpsXkdbwfwCKhwT0D0OsAowwAs5FDHOBbPyb0Ps77F3vov0+seleNVsX-ij7F4RDekKBFxj9xsJoQlK1KsCfIz07tp4H1ymzoboH775y-ymPhm+FXm7EQMB6FHThgLUpzdLlJTpAZx3QjoL7k5S0pHcg+GLQ3h-zgF+VQeDXPYgt2+Ba51QmXXiD4CYTPJ-Qj4SkgCHMJo8qkfPAagL2BS49WShPEqmVRvpVVFcyuVXAt26AlhHQASekAJUmDDNVA2AqrM2AlI6AnwZrL3ha0ja89MeNAoXudXoHxglKdiCxjmGoYMBSGVjcHjplaAhJnCGoW4MYGQYNA4q2+ayhfmIpmBMOZnVkpH1do503+yAsPk8ygC2D-eUfIOhgM-yx8iwX2J0MmgHiE5PAC-ckESDKxt9ZCVYaweHzcF+0A+pbT2HfnG4kd5WkbGwYsDsFl1o+Xgncs1wShfZ92GDNHITmAIuMPAzSVTuk1U7NUAGj-MCGsnvIApBek7IRnQAdbqYnWFvIsJYBhpBhMQ5QoeDYUQDH4PsRxAeBPBpDYYGhEgJoZSjBRCMhC19ZxHPQ4EllE0-SD3qK1OidAwCidO-tSAw51CEg0w2YSqmpR6AzOixfXvdUHbHC9SMwiDhAAuHh8diOQ38j4JjSBBsUDwM1A8HLD-B22IwwzPvjyiFkJBdzE4Y8OeEuCb8iQyMskIhH3DThLQy4e-h-55DYYxFbmuAl1aPBQEoAhAOf3uBXRKShzKsLKiOEakkRUIsPI8LXAcAlMO4VQdXwW6HMcUn2PKBASuYcIc01-IMDoA1CGdT2EOSEc0PmGwBkA+yOkY4Jz6ii5h5wiUVKLFHUoruwNJwqWBzzJp+EOgIYQgF1BQtH4CGUKnPymHUjlRTwxUXIMnZosAesXOUWcItGSirRYKVUeNmhZ+4HgJxEgR6HY7JM9MRmTpE02sxCjJBhbaQZQNkFa9BedA94ofxS4IoFShgQIY3X5F1hj0CPUCkLh6DoYIgTIYgMvngAVAHi2gjEDrgpBu4rA8VBwGwzyheAfE4VB5PDFCCGIkgTkEsSM0qyc5vR39Dmig2xDmxSSkFGLK4SOHtjVAgRMYN+E8ABgLC3QdbjlwlTECyw-QY3GEmwwVwhYtUdsfygtr9w3uQ8DoCSGnjlNk2peNvv2zuYbiQ4C4TcSuG3HgIcQcoPWBlGMH6cTYOMS6MXFDH-orxdsK1s1HQj-J7x5IbNK0mzgGw9RmITVtjEKh4wT234iHL+OFg1tmoAUNqMFCGAfComD40CWlFRjGCEGruGCWbC-GXiHom4p6O0VazATgScNPCfrAIleIC4psT8fBLInBw-xxbAghHGljtEaJj4sCfhI4Q9p3xsE82OuPIkhwtChBFAghEgD8TcJz4nOOjEwzMSPxRcNibFyQnTQjG9430Ppg8ByFRc0qYwU1U0alYzijwAdMTjHFhVJx8DGcWwiaCftWIV0QrGtleA+BdYtQ4UQfTMTtjQQ-oQXLmQJCHo7A0CW4NzTtRmAHUe9Xye+WB6HJ2xXuGnsXnUInFdRgQL0tXUhZvAD8PkhCX5LJRKpzRAU2DPYH6ZWUHgRZVNNaltShB4Y1tbPHbUbTtix8hWL0GYEqFfY5e2jRGOFVeSrUqQ4I2LvZlQB4Ao8wKFSKgBQitSuh14OfiEkNxhUGWGUN7AaP8Ae50OFgcXKlmlxvR2xidbECGCCC28dRTQaBKAVJY9A8YeORlvFNor1ozs7YrOCEneDzVpKP9IJKEAsydhLiY+e6YVPfI259pyAQ6ePBCSoMnwxgUBIggNw7CT0vRKwFvUOEPTHq1eSPGAGSnacBMQuY1qPkvQ0tg8RxKeBSLRkk1r8y+ZKQh2xFVg-gU8crLVJwEhgvsPQAzHiFV4b8eS9nGEfICIJIQSCzUZKUSEEjj5qplgQkMM2fD6BQpoRTiFeRGlc9YkWhFmIdLDDnMHCfw6wpSBcmJQtA9hX0FSDJCwstAdtdIi9M4HQkVq6eLXK8BCJTV40nXQ2bcE953McCZnJmNRPmkusCUVWZFN+AGbGpRUnUuxs0HZlwNUelI1In1nxJYAXpK9UsOg2FSw0ukkJW7vcnxBzjz0isnPrEnjIrhrStpMMmOOMr2TpxrNHwM5J4y3dkEfQMMA1XX63CvaVGDcpFxhgYj6gxuXoUag8CW1gwwzVbPcERRwtEErs0ab8jq4kBkpV6IeC7NkJhgamihXkV6CXq4oKim1KOb8hf7KUS5GeB4K8FJm+ggwBI9vq3VBJ9JeOO0zeV-BkFZV4hyU-zsJTxHHpm+ihUvO1RPRXxLC9Wa+cLUc6O1VaWdewekjakTingGrR8Pf0bqioqmllUCX0n8CANl4O-Yvv33bmEtYYnoj+Yj0qKWBGethULNNTvQnEaQngINm1KZqN0-W5LRBBfy-agIVOa2DVq8EvLGBMOuk72f808B3B4GwQR0M2A9bet2IBmd0DoDoK95MOczBZksxQjbi6mkhWnqCIFFsNnQS4pUP4EMpMlKRRvcPkzAoV6ZwqqiGBL6HClM8mwJ4rPBDPaQXj3+fja1py0Cwdy9oDYR4Fo3pA6h9EVLHYaIvdBIwtANipwSZxQl+RDpDUpfq8D6BNhYaBI64HlC45dBiKwmVNvxwvbjtSpnC5HEPk64QzCUpQjjg2APZugywmfTSYEraYCdKO-8xJCchens97gQQJsQRXuQt9ClIwcYkwjmDaLI2qAWAjOEupjsIAwsn6aaj-qvg1sPpcVjwtlCvsPAUwP4F9zM7K1LO8gPRRktYjXlJxRmLXFWH7wCD+hn4G6TOJ4j6zAOOfYbl+UmT3i2qnySFjYBJHz8cuAlYkQal0E75qQsA3yhdwoBqzAWKKdhj4gCQ8jCsV0Z0GCxMCeTOZTcotrfOoFRjaB51fHi9Op5zLbwAYLFMM0Qx9xnQ++SzGtlOVcydFLgzITLVkVrKEUVIfQK0GCyhVbgTvO4K0l-D182gN5bvtkxQV79HFGChNtmQxy8DWEgRYwaoA-AI9yw4RL0M6BzkEqUBnylyjvLJVW99AbpXjLox+wqKT+YimLKdMmFdK-GMKrHnCvkEuBWSyUngb8ACBYMRgriwVaYO+CTwBIKMTEAErOVpCYhGQ9wcAtJVYS7s55UEFozEHEVdZgg7KY6FAS4ycoTqrmfaMnYmqBcD4CWZEXGLtteI2sJqvxmaBahTRNpB4eaP8lkqL8NPabHlE6kop+IdgUYWEn05nEQxiIrNciPFEvCqZZKypp+DGWklug2rUtWg3uUOBQEqUCNU3KjXzCFwn0YevlTakhhXc9IQ3Jxgxzpthhwy+5T6VfrBBM1jQmkWAEHCPD2xoQPlJKTkKirIiPI01L8DvQ6gdElhVddmvlGOilR16tqWEn6kasolptdGJMBrqnrTWIwC9ZSMHXnCxA5otJGkEGVNrQS3pLFLqGMzPAeRoBJhFqCnhXlahEQIAA */
    id: 'authMachine',

    predictableActionArguments: true,
    tsTypes: {} as import('./index.typegen').Typegen0,

    schema: {
      context: {} as AuthMachineContext,
      services: {} as AuthMachineServices,
      events: {} as AuthMachineEvents,
    },

    context: initialContext,

    states: {
      inactive: {
        on: {
          INITIALIZE: [
            {
              target: 'active.login.fetchingForgeData',
              cond: 'forgeClaim',
            },
            'active',
          ],
        },
        exit: assign({
          error: () => undefined,
        }),
      },

      active: {
        states: {
          web3Connector: {
            states: {
              connecting: {
                on: {
                  CONFIRM_WEB3_LOGIN: 'emailInput',
                },
              },

              emailInput: {
                on: {
                  VERIFY_EMAIL_ELIGIBILITY: 'verifyingEmailEligibility',
                },
                exit: assign({
                  error: () => undefined,
                }),
                entry: assign({
                  googleOtpCode: () => undefined,
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                  salt: () => undefined,
                }),
              },

              verifyingEmailEligibility: {
                invoke: {
                  src: 'verifyEmailEligibility',
                  onDone: {
                    target: 'email2faCode',
                  },
                  onError: {
                    target: 'emailInput',
                    actions: assign({
                      error: (_, event) => event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              email2faCode: {
                on: {
                  VERIFY_CLAIM_NFT_EMAIL_2FA: 'verifyingClaimNftEmail2fa',
                },
              },

              verifyingClaimNftEmail2fa: {
                invoke: {
                  src: 'verifyClaimNftEmail2fa',
                  onDone: 'emailConfirmed',
                  onError: {
                    target: 'email2faCode',
                    actions: assign({
                      error: (_, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              emailConfirmed: {
                type: 'final',
              },

              idle: {
                on: {
                  SELECT_CONNECTOR: 'connecting',
                },
              },
            },

            initial: 'idle',
          },

          login: {
            states: {
              idle: {
                on: {
                  NEXT: {
                    target: 'retrievingSalt',
                    actions: assign({
                      googleOtpCode: () => undefined,
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                    }),
                  },

                  LOGIN_WITH_WEB3CONNECTOR: '#authMachine.active.web3Connector',
                  GOOGLE_LOGIN: 'googleLogin',
                  ADVANCE_TO_PASSWORD: 'inputPassword',
                },

                exit: assign({
                  error: () => undefined,
                }),
              },

              retrievingSalt: {
                invoke: {
                  src: 'retrieveSalt',
                  onDone: {
                    target: 'loginMethodSelection',
                    actions: assign({
                      salt: (_context, event) => event.data?.salt,
                    }),
                  },
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) => event.data?.error,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              inputPassword: {
                on: {
                  BACK: {
                    target: 'idle',
                    actions: assign({
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      error: () => undefined,
                    }),
                  },

                  COMPLETE_GOOGLE_SIGN_IN: 'verifyingGoogleLogin',
                  VERIFY_LOGIN: 'verifyingLogin',
                },
              },

              verifyingLogin: {
                invoke: {
                  src: 'verifyLogin',
                  onDone: [
                    {
                      target: 'hardware2fa',
                      cond: 'hasHardware2FA',
                      actions: assign({
                        active2fa: (_context, event) => event.data?.active2fa,
                      }),
                    },
                    {
                      target: 'software2fa',
                      cond: 'hasSoftware2FA',
                      actions: assign({
                        active2fa: (_context, event) => event.data?.active2fa,
                      }),
                    },
                    {
                      target: 'newDevice',
                      cond: 'isNewDevice',
                    },
                    {
                      target: 'email2fa',
                    },
                  ],
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              successfulLogin: {
                type: 'final',
                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                }),
              },

              software2fa: {
                on: {
                  CONFIRM_SW_CODE: 'verifying2faCode',
                  USE_HARDWARE_2FA: 'hardware2fa',
                  BACK: {
                    target: 'inputPassword',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
              },

              verifying2faCode: {
                invoke: {
                  src: 'verify2faCode',
                  onDone: [
                    {
                      target: 'newDevice',
                      cond: 'isNewDevice',
                    },
                    { target: 'successfulLogin', actions: 'setSessionUser' },
                  ],
                  onError: {
                    target: 'software2fa',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              hardware2fa: {
                on: {
                  USE_SOFTWARE_2FA: 'software2fa',
                  VERIFY_HW_AUTH: 'verifyingHwAuth',
                  BACK: {
                    target: 'inputPassword',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
              },

              newDevice: {
                on: {
                  CONFIRM_DEVICE_CODE: 'verifyingCode',
                  RESEND_CODE: 'resendingConfirmationEmail',
                },
              },

              verifyingCode: {
                invoke: {
                  src: 'verifyDeviceCode',

                  onDone: {
                    target: 'successfulLogin',
                    actions: 'setSessionUser',
                  },

                  onError: {
                    target: 'newDevice',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              resendingConfirmationEmail: {
                invoke: {
                  src: 'verifyLogin',
                  onDone: {
                    target: 'newDevice',
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              email2fa: {
                on: {
                  RESEND_CODE: 'resendingEmailCode',
                  VERIFY_EMAIL_2FA: 'verifyingEmail2fa',
                  BACK: {
                    target: 'inputPassword',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
              },

              verifyingEmail2fa: {
                invoke: {
                  src: 'verifyEmail2fa',

                  onError: {
                    target: 'email2fa',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },

                  onDone: {
                    target: 'successfulLogin',
                    actions: 'setSessionUser',
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              resendingEmailCode: {
                invoke: {
                  src: 'verifyLogin',
                  onDone: {
                    target: 'email2fa',
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              verifyingHwAuth: {
                invoke: {
                  src: 'authenticateWebauthn',

                  onDone: [
                    {
                      target: 'newDevice',
                      cond: 'isNewDevice',
                    },
                    { target: 'successfulLogin', actions: 'setSessionUser' },
                  ],

                  onError: {
                    target: 'hardware2fa',
                    actions: assign({
                      error: () => 'Failed authenticating with hardware key',
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              fetchingForgeData: {
                invoke: {
                  src: 'fetchForgeData',
                  onDone: {
                    target: 'idle',
                    actions: assign({
                      forgeData: (_, event) => event.data,
                    }),
                  },
                  onError: 'idle',
                },
              },

              verifyingGoogleLogin: {
                invoke: [
                  {
                    src: 'verifyGoogleLogin',
                    onDone: {
                      target: 'successfulLogin',
                      actions: 'setSessionUser',
                    },
                    onError: {
                      target: 'inputPassword',
                      actions: assign({
                        error: (_context, event) =>
                          event.data?.error || event.data?.message,
                      }),
                    },
                  },
                ],
              },

              googleLogin: {
                invoke: {
                  src: 'googleLogin',
                  onDone: [
                    {
                      target: 'idle',

                      actions: assign({
                        registerUser: (_, event) => event.data?.registerUser,
                      }),

                      cond: 'isNewUser',
                    },
                    {
                      target: 'inputPassword',
                      actions: assign({
                        googleOtpCode: (_, event) => event.data.googleOtpCode,
                        salt: (_, event) => event.data.salt,
                        googleUser: (_, event) => event.data.googleUser,
                      }),
                    },
                  ],
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },

                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                }),
              },

              retrievingRCR: {
                entry: assign({
                  error: () => undefined,
                }),

                invoke: {
                  src: 'startPasskeyAuth',
                  onDone: {
                    target: 'localSignCredential',
                    actions: assign({
                      RCRPublicKey: (_context, event) => event.data,
                    }),
                  },
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
              },

              localSignCredential: {
                on: {
                  FINISH_PASSKEY_LOGIN: 'verifyingRegisterPublicKeyCredential',
                  BACK: {
                    target: 'loginMethodSelection',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
              },

              verifyingRegisterPublicKeyCredential: {
                entry: assign({
                  error: () => undefined,
                }),

                invoke: {
                  src: 'finishPasskeyAuth',
                  onDone: [
                    {
                      target: 'hardware2fa',
                      cond: 'hasHardware2FA',
                    },
                    {
                      target: 'software2fa',
                      cond: 'hasSoftware2FA',
                    },
                    {
                      target: 'newDevice',
                      cond: 'isNewDevice',
                    },
                    { target: 'successfulLogin', actions: 'setSessionUser' },
                  ],
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
              },

              loginMethodSelection: {
                on: {
                  SELECT_PASSWORD: 'inputPassword',
                  START_PASSKEY_LOGIN: 'retrievingRCR',
                  BACK: {
                    target: 'idle',
                    actions: assign({
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      error: () => undefined,
                    }),
                  },
                },
              },
            },

            initial: 'idle',

            on: {
              SETUP_REGISTER_USER: {
                target: '.idle',
                actions: 'setupRegisterUser',
              },
            },
            entry: assign({
              error: () => undefined,
            }),
          },

          register: {
            states: {
              idle: {
                on: {
                  SHOW_TERMS_MODAL: 'termsModal',

                  SEND_REGISTRATION_EMAIL: {
                    target: 'sendingEmail',
                    actions: assign({
                      googleOtpCode: () => undefined,
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                    }),
                  },

                  ADVANCE_TO_PASSWORD: 'createPassword',
                  LOGIN_WITH_WEB3CONNECTOR: '#authMachine.active.web3Connector',

                  SETUP_REGISTER_USER: {
                    target: 'idle',
                    internal: true,
                    actions: 'setupRegisterUser',
                  },

                  GOOGLE_LOGIN: 'googleLogin',
                },

                exit: assign({
                  error: () => undefined,
                }),
              },

              termsModal: {
                on: {
                  CLOSE_TERMS_MODAL: 'idle',
                },
              },

              sendingEmail: {
                invoke: {
                  src: 'sendConfirmationEmail',
                  onDone: {
                    target: 'emailValidation',
                    actions: assign({
                      salt: (_context, event) => event.data?.salt,
                    }),
                  },
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              emailValidation: {
                on: {
                  VERIFY_EMAIL: 'verifyingEmail',
                  BACK: {
                    target: 'idle',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                  RESEND_CODE: 'resendingRegistrationEmail',
                },
              },

              verifyingEmail: {
                invoke: {
                  src: 'verifyEmail',
                  onDone: 'registerMethodSelection',
                  onError: {
                    target: 'emailValidation',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              createPassword: {
                on: {
                  COMPLETE_REGISTRATION: 'completingRegistration',
                  BACK_TO_IDLE: {
                    target: 'idle',
                    actions: assign({
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      error: () => undefined,
                    }),
                  },
                  BACK: {
                    target: 'emailValidation',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
              },

              completingRegistration: {
                invoke: {
                  src: 'completeRegistration',
                  onDone: { target: 'userCreated', actions: 'setSessionUser' },
                  onError: {
                    target: 'createPassword',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              userCreated: {
                type: 'final',
                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                }),
              },

              resendingRegistrationEmail: {
                invoke: {
                  src: 'sendConfirmationEmail',
                  onDone: 'emailValidation',
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              googleLogin: {
                invoke: {
                  src: 'googleLogin',
                  onDone: [
                    {
                      target: 'createPassword',

                      actions: assign({
                        registerUser: (_, event) => event.data?.registerUser,
                      }),

                      cond: 'isNewUser',
                    },
                    {
                      target: 'idle',
                      actions: assign({
                        googleOtpCode: (_, event) => event.data.googleOtpCode,
                        salt: (_, event) => event.data.salt,
                        googleUser: (_, event) => event.data.googleUser,
                      }),
                    },
                  ],
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },

                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                }),
              },

              retrievingCCR: {
                invoke: {
                  src: 'startRegisterPasskey',

                  onDone: {
                    target: 'localSigningPasskeyRegister',
                    actions: assign({
                      CCRPublicKey: (_context, event) => event.data,
                    }),
                  },

                  onError: {
                    target: 'registerMethodSelection',
                    actions: (_context, event) =>
                      assign({
                        error:
                          event.data?.error ||
                          event.data?.message ||
                          event.data,
                      }),
                  },
                },
              },

              localSigningPasskeyRegister: {
                on: {
                  FINISH_PASSKEY_REGISTER: {
                    target: 'sendingPublicCredential',
                    actions: assign({
                      credentialEmail: (_, event) => event.payload.email,
                    }),
                  },

                  BACK: {
                    target: 'registerMethodSelection',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
              },

              sendingPublicCredential: {
                invoke: {
                  src: 'finishRegisterPasskey',
                  onDone: 'retrievingRCR',
                  onError: {
                    target: 'localSigningPasskeyRegister',
                    actions: (_context, event) =>
                      assign({
                        error:
                          event.data?.error ||
                          event.data?.message ||
                          event.data,
                      }),
                  },
                },
              },

              registerMethodSelection: {
                on: {
                  SELECT_PASSWORD: 'createPassword',
                  START_PASSKEY_REGISTER: 'retrievingCCR',
                  BACK: {
                    target: 'idle',
                    actions: assign({
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      error: () => undefined,
                    }),
                  },
                },
              },

              retrievingRCR: {
                invoke: {
                  src: 'startPasskeyAuth',
                  onDone: {
                    target: 'localSigningPasskeyAuth',
                    actions: assign({
                      RCRPublicKey: (_context, event) => event.data,
                    }),
                  },
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
              },

              localSigningPasskeyAuth: {
                on: {
                  FINISH_PASSKEY_AUTH: 'sendingAuthPublicCredential',
                  FORCE_PASSWORD_METHOD: 'createPassword',
                  BACK: {
                    target: 'registerMethodSelection',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
              },

              sendingAuthPublicCredential: {
                invoke: {
                  src: 'finishPasskeyAuth',

                  onDone: {
                    target: 'userCreated',
                    actions: 'setSessionUser',
                  },

                  onError: {
                    target: 'localSigningPasskeyAuth',
                    actions: (_context, event) =>
                      assign({
                        error:
                          event.data?.error ||
                          event.data?.message ||
                          event.data,
                      }),
                  },
                },
              },
            },

            initial: 'idle',

            entry: assign({
              error: () => undefined,
            }),
          },

          forgotPassword: {
            states: {
              idle: {
                on: {
                  SEND_CODE: 'sendingCode',
                  RESET_PASSWORD: 'newPassword',
                },
              },

              sendingCode: {
                invoke: {
                  src: 'sendCode',
                  onDone: 'codeSent',
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              codeSent: {},

              newPassword: {
                on: {
                  CONFIRM_PASSWORD: 'savingPassword',
                },
              },

              savingPassword: {
                invoke: {
                  src: 'confirmPassword',
                  onDone: 'passwordSaved',
                  onError: {
                    target: 'newPassword',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              passwordSaved: {
                type: 'final',
              },
            },

            initial: 'idle',
          },
        },

        initial: 'login',

        on: {
          RESET: 'inactive',
          SIGN_UP: '.register',
          LOGIN: '.login',
          FORGOT_PASSWORD: '.forgotPassword',
        },
      },
    },

    initial: 'inactive',

    on: {
      RESET_CONTEXT: {
        target: '.inactive',
        actions: [
          'clearContext',
          () => {
            Cookies.remove('access_token', {
              secure: true,
              sameSite: 'strict',
              path: '/',
            });
            Cookies.remove('refresh_token', {
              secure: true,
              sameSite: 'strict',
              path: '/',
            });
          },
        ],
      },
    },
  },
  {
    services: {
      async completeRegistration(context, event) {
        throw new Error('Not implemented');
      },
      confirmPassword: async (context, event) => {
        throw new Error('Not implemented');
      },
      sendConfirmationEmail: async (context, event) => {
        throw new Error('Not implemented');
      },
      retrieveSalt: async (context, event) => {
        throw new Error('Not implemented');
      },
      sendCode: async (context, event) => {
        throw new Error('Not implemented');
      },
      startRegisterPasskey: async (context, event) => {
        throw new Error('Not implemented');
      },
      finishRegisterPasskey: async (context, event) => {
        throw new Error('Not implemented');
      },
      finishPasskeyAuth: async (context, event) => {
        throw new Error('Not implemented');
      },
      startPasskeyAuth: async (context, event) => {
        throw new Error('Not implemented');
      },
      verifyLogin: async (_, event) => {
        throw new Error('Not implemented');
      },
      verify2faCode: async (context, event) => {
        throw new Error('Not implemented');
      },
      authenticateWebauthn: async (context, event) => {
        throw new Error('Not implemented');
      },
      verifyDeviceCode: async (context, event) => {
        throw new Error('Not implemented');
      },
      verifyEmail: async (_, event) => {
        throw new Error('Not implemented');
      },
      verifyEmail2fa: async (context, event) => {
        throw new Error('Not implemented');
      },
      verifyEmailEligibility: async (_, event) => {
        throw new Error('Not implemented');
      },
      verifyClaimNftEmail2fa: async (context, event) => {
        throw new Error('Not implemented');
      },
      fetchForgeData: async (_, event) => {
        throw new Error('Not implemented');
      },
      googleLogin: async (_, event) => {
        throw new Error('Not implemented');
      },
      verifyGoogleLogin: async (_, event) => {
        throw new Error('Not implemented');
      },
    },
    guards: {
      // @ts-ignore
      isNewUser: (_, event) => !!event.data.isNewUser,
      forgeClaim: (_, event) => !!event.forgeId,
      hasHardware2FA: (context, event) => {
        const { data } = event;
        const HARDWARE = 1;
        // @ts-ignore
        if (data?.active2fa)
          // @ts-ignore
          return data?.active2fa?.find(
            (item: any) => item?.twoFaTypeId === HARDWARE
          );
        return false;
      },
      // eslint-disable-next-line arrow-body-style
      isNewDevice: () => {
        // TODO removed until next-auth is out

        return false;
        // const { data } = event;
        // // @ts-ignore
        // if (data?.error?.includes('Invalid device')) {
        //   return true;
        // }
        // return false;
      },
      hasSoftware2FA: (_, event) => {
        const { data } = event;
        const SOFTWARE = 2;
        // @ts-ignore
        if (data?.active2fa)
          // @ts-ignore
          return data?.active2fa?.find(
            (item: any) => item?.twoFaTypeId === SOFTWARE
          );
        return false;
      },
    },
    actions: {
      setSessionUser: assign({
        sessionUser: (_, event) => event.data,
      }),
      setupRegisterUser: assign({
        registerUser: (_, event) => event?.registerUser || undefined,
      }),
      clearContext: assign({
        salt: () => undefined,
        error: () => undefined,
        active2fa: () => undefined,
        registerUser: () => undefined,
        googleOtpCode: () => undefined,
        googleUser: () => undefined,
        sessionUser: () => undefined,
        forgeData: () => undefined,
      }),
    },
  }
);

let stateDefinition;

// @ts-ignore
if (typeof window !== 'undefined') {
  let authState = localStorage.getItem('authState');
  if (authState) {
    stateDefinition = JSON.parse(authState);
  }
}

let resolvedState: any;
if (stateDefinition) {
  const previousState = State.create(stateDefinition);

  // @ts-ignore
  resolvedState = authMachine.resolveState(previousState);
}

export const authService = (services: {}) =>
  interpret(
    authMachine.withConfig(
      {
        services,
        guards: {
          // @ts-ignore
          isNewUser: (_, event) => !!event.data.isNewUser,
          forgeClaim: (_, event) => !!event.forgeId,
          hasHardware2FA: (context, event) => {
            const { data } = event;
            const HARDWARE = 1;
            // @ts-ignore
            if (data?.active2fa)
              // @ts-ignore
              return data?.active2fa?.find(
                (item: any) => item?.twoFaTypeId === HARDWARE
              );
            return false;
          },
          // eslint-disable-next-line arrow-body-style
          isNewDevice: () => {
            // TODO removed until next-auth is out

            return false;
            // const { data } = event;
            // // @ts-ignore
            // if (data?.error?.includes('Invalid device')) {
            //   return true;
            // }
            // return false;
          },
          hasSoftware2FA: (_, event) => {
            const { data } = event;
            const SOFTWARE = 2;
            // @ts-ignore
            if (data?.active2fa)
              // @ts-ignore
              return data?.active2fa?.find(
                (item: any) => item?.twoFaTypeId === SOFTWARE
              );
            return false;
          },
        },
        actions: {
          setSessionUser: assign({
            sessionUser: (_, event) => event.data,
          }),
          setupRegisterUser: assign({
            registerUser: (_, event) => event?.registerUser || undefined,
          }),
          clearContext: assign({
            salt: () => undefined,
            error: () => undefined,
            active2fa: () => undefined,
            registerUser: () => undefined,
            googleOtpCode: () => undefined,
            googleUser: () => undefined,
            sessionUser: () => undefined,
            forgeData: () => undefined,
          }),
        },
      },
      authMachine.context
    )
  )
    .onTransition((state) => {
      if (state.changed && typeof window !== 'undefined') {
        localStorage.setItem('authState', JSON.stringify(state));
      }
    })
    .start(resolvedState);
