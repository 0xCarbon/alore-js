import { State, assign, createMachine, interpret } from 'xstate';
import {
  AuthMachineContext,
  AuthMachineEvents,
  AuthMachineServices,
} from './types';

const initialContext: AuthMachineContext = {
  salt: undefined,
  error: undefined,
  active2fa: undefined,
  sessionId: undefined,
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
    /** #no-spell-check @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBGACwA2bQDoArACYjAZgDsRgQA5tp6+YA0IAJ6JTR9XtPGAnL6NrdT9tIwBfMOc0LFwCEjA9EnxZADdyAEl2dPp0gEEAGXSALSpBESQQSWlZeUUVBA0BbS91a19TdW0DAU1fcw9nNwQDXT1W8wFTAItA+wiojBx8IlJE4mTCNLJM7LzCkr51cvEpGTkFCvrVX3VzPXNzXwEn8xH2o0HETX69Iz6PARafoTXwGeYgaJLOKrDZbah0fjCRRVM61S5qdRNTS-EE3HSaaymGyfBrqeyGIyaQGaVoeayU8KRCGLWIrBKw8g0dIAcXYjAAqgAFMrI041C6geqWbFPHoBHrBYwfVxqR56LrmKndUGYymmcGQ1nxPQcsj5VjczIiioo8V1dy+bFUwJtAzGczaTSUkmaAx6TQeP7WAxaawOWwGlnLY2mgBirAo3NYTEFuRoNAA6gmACLWk7Vc724ZkvSg0xEtraIK3Xwk1Q+f0GTS9QJdIzaR3aSMxaMwvCpBIAdzAACNTMx5KR+xIAE56PCTsD9khQMhsdix9IUbCMDNUABCpkY5st7DzlTFhfRCD+ll+tnUJj+7W0mpJ9NMv3U4wDj6pQW7KE2RNZc0j0YcxwnYgp3QWc9DAABbZBCAAG3SYgxAwMgADUqAodJYwATUYKhsFydJ8hIwpLX3CjskI89bSvSVED+V972aJ9-FMV9NBJB4-U8H8OkpGx1EAo0+wHcDR3HRdpznNIZ0IAAzFwVyoJDUKoFDCCgQgR1QmQXDICB5ASEgUgkABrdko2hdlQKHWSoJguClNU9TiCgTTkJQnS9IMoz0BcBBLIkPBkHFMpGMvNEWIQCsnQMR4+mfHi3xVBB2k-cxvwcX9RIAplDV7RzpIguToKXWDFLAZS1I0rT-N0-TDN0kKyHqmc4LEFCopU2cEJNezgI5GTIPk2q9A8xrvN87TWqCjrQvCyLouEWKC3i5R3BsZLUssbjeJJbiv2Ev8BEeCSypAiqXKmuDEL8owVOQCcIHIXD8KIlh8nIncNyYUjyMooxY1yLbUQlXab18No9CCYETGOzKhkxYx7nyzURKpa6StGmMnImqq3LqhqvKgZh+sIBD2BU9AFpQ17kFM8y1is2yRp7By7s2ZzJuqhSZvqzyV2p5C6YZpmWbC4grPW84YqRG04ph+oOkBRHAU1I6XzRxBv2Cc6Ctxq7fBu3nxsq1yavc0W5qpmmpcZ5qWa6mcernPqBqG7mgKJ+7BbJkWKfF536ddl63rlhWoqVzaVfzaGi01rxrB1750pOrLv01LGLtE-GFh5sbiZtx650ICAUM5Kh8ioZgmHXdhG-oBMobta92z6QxXmCIkbkmdR33Y3xQimSZdHbNpLbL6SUIkfTiDIBEhUYahLRoLgKAFOgKE75jYame43lsZ9XipHoSTMLQxk1JssQfwk58D-m9EX5fEhr8hW94Q+doay9BSAwUx+jBkxJYG+Ew7iPGeJWAwARx6aFflJd+n8SDf1rmaC0mRdzZAABK7gPOODgrcm4dyTheba6tDbj39ASIwbpbgdEJAYEkNZPwOCJMEZogI-yoPKugpemDq7YKTBaBux5cFnioUxQBrF2L2AcOPJoECbg3wfOdHwzQ7AehSoIvmYEMHECweQXI2ZsK5HYMwKgjB26MFTOmLMFBcxyLVkWGkdwbg3D8D0AQfwb4pSMN4JookLBhlAYY8aJi9AzjAOgZSYAUgrhoMgFC6A2arHClzUqVtiaxPiYkwgyTUnpPQLHCK8d5DK2ONQlO14Hi+G8L0TUzZ2iPGCDfJ4zSLC3HbHYII5YuwE1Lm-YxIjTFFKSSk7yaSMkey9noH26BBozmGnk+ewiv7TJKbMqA8yKlrWqcQWpooaFFnrPoSwwR+gdg9D0Zo3TjaeCbOPMBAZJjRIKZMtYmF0CCmQLAWAg5ZwQDIPuXIzAADSADaEIAJNc6wAZx7NH+ICG+dgBClgCXlPKr4bAOG+QvX5JB-mAuBaCmc4K2DYEFA3LgjAJHcikVyXkjArTuIudeNodx2wovaAEQIrQSSsP0KELOKiBABJ0MS7ZoiMIYApSCsFOE8IEWIieTldT5HwsfAIQSYZzCElMDoRUyohhGDxXoZ4jppisM1HKiZX9ZqU3yJMrJFl5Y2TsmMtBzrMGupXO65elTFY1MTjqjx15aR+l0HimwE8+h8Syvyv0V0QSvCtZMAxoyA7+oSLEoN3kQ0kE9RzH1-tJJCIDaY4tUBS3EDDScmKRxzkNISrSLwboBnfmeKa8s0CT6PF6BnXF3R6ROsLb8+tjby05N9fmmt06XUOzdZM5tG0hB8CMFG7lnbCTduMLoPt7QAymE0c2RGKUCTSqtROxkJcl1GJXYGtdwaPVmWyd63JhMC0fxne+ktG7jlbr4KYPdHbYatCvYEVsHQyQY1Ffw+4ui-hEn6DoqdAHV1h2A8vRZvV+qrL9ps8Zr661AYbSB714bTmRvbV3BKjw7ieitR0XobozU3xpNinohIM26huPqPN1aX04cwbACQDNBzIHie7dcm5tyMEzCwVg2ZShcqg-UL0joxgGAzhMHiNIaSYpMIYAJuhmwWH7th2JUmZNybAO7fkdBGAENyK4jMnm7Hg0hlppjx8Ah3CbJ0XFryCQXtTTSfQwzKR5VYT4OzvyHPoFk-Jt6EKoWwoC0feo-LrA2qujWZsVrQRBIcGMYTAQ+HtDdMl3DYtvIsw+uQL9XrOaLrEzEwDeGoAtYkJ9TdCdt25YUcMGVvxPCTAzvSN4QTQHeFvkZuk6gLaiduj1xrjsBufXnT+rrm2fnbcprtsAw2I3brbarfdsNugeC-JrfovRTWYqeIjAIoDeiTA6Q1t9fWzuEe9sRtZGy-3Lok5RgHb1WsXfo6NyDgWdNBlQ5SZsHpmjIugdKizGdRI9AsM2P7pjMByYgOl5zmXXN2JoKwWM9BvPUEYH5uFqcAiFfuUjUBpqnCptAV4A1vRvigmMB4YnehSfUop+7b6Gr3MZkYLkfk9ACGs+vLp8V2hnghmbG6YwN9PCa+-DSHpWgRlPu68dzBkvydOfdpCmFavO2PH0GYEEVhpVNjygbv4hhEHtjW+WNoPRxekEHNmUpeByCKa3DuDT2F0i2LUxpp3d2JghOeF0XQnpE3WGgUEbwrQDXsaeI+5kfqIexLDxHlJUfKC0CoOwbMyfNOI7y4gEM9CAnSvLPYY1XpunljGCijOWh-CgnF-W1r+3OtVqOySk74tBvndAyN1P9RQiUn9JqQI3QDNUhTZaj0n52xfd3wZ+5k+qPT+6kR326y5-5IX-9prVNl9w7OTd7THeJheF16EOwJBHQTRK1f0J8dsJhZFcXeJWAMAYgCAJfYgFSQgdZE5JmGfStMjf9QpOAOAhA7yKCZA1A8UJmD-BjL-JHDvHoO4QEHwG4b8PpdhVNfwPjGkB8bvQMFBDbJ-eVUxZ6VCd2eERvZvNgFPMbeFewTwdUF7WwB4QXPPLKOkbFF8YwBgsrX0cXfg5mTLWXX6EGCiZnCGdfL4GwWBLQAzKYG4TUBQoYDjbFZFN0DoY1aVXQTQt2TLB3HLNvcbCA5pA1MSK1dsPvUVYIbFGkFKY1LtPKK-PrGWTLdrCtX9CvcTItKjOI5AMghHRjdvBFdobFOwc9RhKwbQEI0YeNB4LXHpQEGI1-dIoHZZEHUjcHFI3rWo9wjI1fS7YwhFZ4bFJsYoykDUK6ZDb8VDTodDK6csEYaA3A+ApqPyafBIhdR-LZWtOJWY-AnyZqWHTo+HboywkJDOZoTEJ4U1EYUVJhZpXED0WwUvMvLAyvVox2AhQcXIRYDApI59LbF-Z414xYTI7o-owrbNEYQAykLHVNN3dUZNYwWwKsIIc3cvL4q3KHV-F4t4rAD4w7HgtY+tdE-43Y1tbw+FLXLWAJNbEMfaPGA3CwaEh+VseEzoGo34jEzAeolZUHFY8jSHUONEv4rAAE8QzxK1O4NoGeYMCwHiEo1NcsEJFKFKTELoMkSdbg1YijPQFSBJaEKAWMWcGAbMKKVmJYg7Lk7A35TU9AbU3UmcfUw0wU4ky5cYnELoY9bofaKsIJfwf0LXfEF0AkcXC0q0vUsAA09AVmW-YHe-MHZI740xQMlYHU4M0Mjo2jFtcg5OSg0kK6UsQIXjQkJ4NoMMIJXoCkJBEE8fZkymbkCQJeWuOdY02fB4loxfbyas2ssARte07I8bVoEMU+EESYSzCwUVESOkpoY4rQK1SslcNsqAOsj1CMhoqM00x4lsqAWc+c0NQk9M+pTM10e8V4OErXFKYcxQ1ha9ZoKYKkeGWYcXKAGsucjsz9dmZYps2MvQe89szs7crIignIswQSPRflLxRBUIEIn4J4eE-tJoHiO8h8zcstBszA5o98z8x8781MsDa7DMnI0kwwQkE3U-ekb4cCz8F4LEGecYe4lClEj8+Cp8gjRcjkpomM2itChCptH87o+sZpAkNbW4CYfoqsXQZDWkx0S+eLRBekREt82i3ZUpbyCgZgCgLElc5szBeS-ZJSigLsv8nwhGTUJoW4XQR5MkUVU4v3V8ewW4IIKA1U7knA4pBSqAbS9kxoh-WS5-KZBJGZFcbS3SnC8bDwbEV8EwXoOwLjXnIYK+DnU1WwJw2yrgi3efXggDSKFCGgPSYgZgeJT6YgWQdJMgTcLIGgIhJxGgaFKgTVGRbo4MPonwYyzUUEO9cygJG1EYeLdjSA8XRedKzKqAbK3KuAgqlCLLR3IUxpGkUsdpJpYzD0WsRQ-oP0UELofhMkCwA1acxSsAfSWAdAeqQUVAEcXSPAaFMAFwHKyAYawgQqpCz4y3Ly3kx2CgHawgPag6o6k6s6i6oa-Km6lCAK3cnIzoEYP3BwKwazBDVqz8N0CYc9UBceMEeys0tcl63a-amcQ646wgU686y6vKka1Szy1K+tNGt6jGrGr6vG36kagE7CoGnstjbwAEHwcG-wCE6Kz3G1fwboYVTPcSZG1cn4ymMm96zGz6nG76-G6626l8k04m3EqjUWimiW3Gn6q6v69JAE3dbsvVNsf0YZRBf8YIEirKf8ZpRBeBCYGVcEraly16sWymyW6mjWwmu67EtUnk0mh2lW7GtW6WzWgGriiDXWosToD0CzCJMMSzWwH0W4bFKYaeSkRU14O25Wj6v2qWmm-6ty5chW9U729GjOqm9Wgm-6wG3VMOjsbEMwIIgAtoHQBa2w4MP0WGgnHwROpG5KnE9UkxbABJTAQbGgMAWuZceQVeeuNuRxNMTMHMbo1FA2zoXlDsLofwUVJsT8NbHvTPOEonQW9S0xPugeoekemqc4VeegTzFMGeyq6q08bo8zfvNu3srQMkaU2w41C2okZsc9YIBwcwHqyZfurAE+0e8UMarw0OmNIke4KYR8R8HnYow-dwAMEJDwDsE81oDGLupEh69+eJIuquH+VeAhVgBXHebAGgRgbAdTAoB+2kFpGy1sIIC-OsR8PTFwpUwEEMF3bDAh8m+qMxCepvDeKgLeegCgXIHIDgEiMiCibotbMMUJYzc1M3OsJGUsZFKsASz0YLPhn2wRsRcxSxaxJPBxcqlxNxB07uPvG1EwNhDjb4EeLKVQEYQrR0Q9MMUfGLfRwhoRrVPkDMQhYhQ8FuNuShaxhKKwTGGrWwUdEYJoKKw2akMAjpSkt0K6XxgRoh7BNeQUUR8RvCPePCBR9m-0E1TEWwBUx0Nhj3MAuGjsA1f4awLJsWoR5lKRAJh+gdMYKwUEG4ekaVJJ0kfpX4HnFsBEqS1pjGvQDGhCWAbAQbQq5gc0NzChqhmh7MOhiaqJ3hD7A1Y1XRm5d+jEMwbEZ7QkDODoQVHB-O9Yvx2AuY+aZqImmi6Sfhtpx5zY0grinZ2GP4TEMYU1ISK6dsDFFx3QQrR4TwPoNKcsB4aZwRr5+Y1CXOkjDyt5-BgxucZF55vyCu6NTtRp700EY1WwYMNKOseGDnF7OwM3ZFL5fe8aD5mZrQ7CdJauE5NVH6YifQ-IfYiGzR0ChBzoQMKlmB-aHGIXYMWeJl4mFlwRtljliALlzwh+30LwfuVKCU8ePodRh7LXD3KYDJkMETbuz2hVucJV3SFV8BoQkR0Q1vKBhKIkCV7+sJF7V5NhrmgClKCBAqdsRF8mNovyV51i957Fp6ymH5zCtfP5jWfM34c9B+GwcfKLIYa4IfbPFKT7JxgW817ky1qNlF0api9y6M5EiNvx+tGNuOMDeNlBu+YF6JxFW5E5hoJpRGD3PoXiAZpK3BlKsCItvAeJKKMAZVKlGlVgOlBlOxTedIbeSR6R2RSJ2GH+lodoYMACzoAMcVv0ToIYwlbidbAt-9Yd0d-aid1VTw+xVgDlbMBubo8I5pJhCAphxBJgjN-VVuthL0OUS86i8NrFvxkdsAMdq96lCB-Y9pLGdPZFUEK1b1mJ3QKSiAgkb4IN+cCQBCPqBJPyn2mcLl92tS5lyNhcHD2uWQba9Gwj8UAl27HTMpokbRkwbN5xjNnKdUFD+u18UlzD8j3Dqj+2mjrlstvOzFodsj7DwT-DkTuj351dnTTUfQcecYr0cMHiNhvOG1fimrceZTlpuVqt7J9Y3F4T8m2j84dA4ju5otmAvA2TiztA5qej7-G8SwWBZoawmy7hKlroHMsrW8De25iThIIt9ihixCuWxs0L+5kziLjCutuNxT9wcYdUX16OweWOlx78TGa2psNsWgkLoDyTvxhL5879GLkrsLyN8rrc2Nro+myu68VhXpXV9pZFZ8Wpq9QkTqyA+KmS2L8L+iudMT9FitvB0r+LkbmjJLrohtm8Zsa5Y11ReLLoLTswFpVQ6kGC8sTDzS8WZSsNyt4Dkzg7gg5S1zzMmkR8RGY-ck+U17XOQF8Z0BQEYeR5fbnyvZQ7lSsbzk2zyN87qmS7hT51oLfOXfGrLxaeOsU-UsV4UEgJabYMTD3q9Jfq4gFcZVWyFwdOmcIqnYUq6e9MW+gphdneJ9vGdUJaroL0UIYYlxjnXRGzaw-oJhQb6ruLtp9HjKrK7HoFWAXH-HqDhbniZFG1Kp01F8Zj9tgCsYY4-EXr7XTnk7qbz5hz7yJ2vAAOt26L5Crnotsz7X3X8usHvS+Fb4HQe4dsfREYdpN0Nht0KbA-LxrXcMfNgdnu7nmZ431W03wq-7litXmrh5zXqAE37OrW83wKy3gebwB5FFJqputQUAuLLhy430YrkPn3wRy14BweiAYesB8+ugBuJuEn2e1xJ9yYT8XoDGZBfoR5PdhX3QewLoZj41L7whgv0Bs+8e7eK+yvsn+d7eEpsXkdbwfwCKhwT0D0OsAowwAs5FDHOBbPyb0Ps77F3vov0+seleNVsX-ij7F4RDekKBFxj9xsJoQlK1KsCfIz07tp4H1ymzoboH775y-ymPhm+FXm7EQMB6FHThgLUpzdLlJTpAZx3QjoL7k5S0pHcg+GLQ3h-zgF+VQeDXPYgt2+Ba51QmXXiD4CYTPJ-Qj4SkgCHMJo8qkfPAagL2BS49WShPEqmVRvpVVFcyuVXAt26AlhHQASekAJUmDDNVA2AqrM2AlI6AnwZrL3ha0ja89MeNAoXudXoHxglKdiCxjmGoYMBSGVjcHjplaAhJnCGoW4MYGQYNA4q2+ayhfmIpmAKBfVfnlr0F50D3ih-FLgigVKGAB4pqDsEGGMGuN2wCPUCkLh6DoZMOZnVkpH1do503+yAsPk8ygChD-eUfIOhgM-yx8iwX2J0MmncE752OagQZKEjKxt9ZCVYYIeHziF+0A+pbT2HfnG4kd5WkbEIYsDCFl1o+SQncs1wShfZ92GDNHITmAIuMPAzSVTuk1U7NUAGj-MCGsnvIApBek7IRnQAdbqYnWFvIsJYBhpBhMQ-QoeDYUQDH4PsRxAeBPBpDYYJhEgKYZSjBRCMhC19ZxHPQ4EllE0-SD3qK1OidAwCidO-tSAw5jCEgxw04SqmpR6AzOixfXvdUHbfC9SJwiDhAABHh8diLQ38ikJjSBBsUDwM1A8HLD-B22OwwzPvjyiFkJBdzH4ZCOhExCb8lQyMtUIJHgjfhMwwEe-h-5tDYYxFbmuAl1aPBQEoAhAOf3uBXRKShzKsLKi+EakqRRIsPJCLXAcAlMO4VQdXwW6HMcUn2PKBASuYcIc01-LwShy76CjCR0w84bAGQD7IxRkQnPtqLOH-C9RBonUdSiu7A0nCpYHPMmn4Q6AthCAXUFC0fgIZQqc-I4cKMtFQjzRcgydmiwB6xcTRfwv0fqIDFgprR42aFn7geAnESBHobIS6OeDnN+BQ8I2gGEM6nsIcRbVALARnCXUx24KagLGHhBEIoUtidMLe0qorttBHeHnDaimBhhjKiCewN6wLz9CTUjwPvCHkFH2ZUAeAKPMChUioAUIc6UseWMVzMAqxVDduLWO6Jz9VhnSY3LfDl45tYGguUEASDhoRAmQxAZfPAAqAPF6xpIHXBSDdxWB4qDgNhnlC8A+Ir4WaazIB2fRJAnIp4jQGl05yJjv6HNFBtiHNiklIKMWVwl8I-GBExg34TwAGAsLdB1uOXCVMQMdAzwAw8Y-tncwrhCxaop4-lBbX7hvch4HQEkNPHKalZeaTQZBNhkwkhwFwWElcDhPAQ4g5QesDKMYP04mwcYl0YuJIO5LUS7YVrZqOhH+QMTyQ2aVpNnANgujMQmrbGIVDxgnseJ-6PicLBrbNQAobUYKEMARFRNGJYktKKjGMEINXcsks2NxIwkPQsJT0doq1hEnAk4a+k-WIZK8QFxTYXEhSeZODj8Ti2BBCONLHaK2SmJ4kgyRwh7QcS5J5sKiRZJDhaFCCKBBCJAACl6SWJOcdGJhhcmcSi47k2LspOmhGMGJvofTB4DkKi5pUxgpqpo1KxnEexAYYnOBK3xGxoJrNHwE0E-asQrohWNbDjF1j+47KOYg+mYlPGgh-QguXMgSEPR2BoEtwbmnajMAOo96fU98sD0OSnivcNPYvOoROLOjAgXpaupCzeAH5RhC02imSiVS+jBpsGewP0ysoPAiyqaa1LalCDwxra2eO2o2lPFj5CsXoMwIMK+xy9tGiMcKq8lWpUh8RsXAcUOLgCwBRx44yZKeLn4hJDcYVBlhlDexuj-AHudDhYHFypZpcb0U8YnWxAhgggtvJ0U0GgSgFSWPQPGHjkZZHTHq9aM7KeKzghJ3g81aSj-SCShALMnYS4mPlpmKShaJOMnLjOQD4zx4ISVBk+GMCgJEEBuF4Sel6JWAt6nwumalWryR4wAK07TgJiFzGtR8l6GlsHiOJTwBRqsxWn1hslLDrwH7DPD23pCnEMG0CHASGC+w9ADMeIVXhvx5L2cSR8gIgkhBILNQVpRIQSOPhumWBCQwzZ8PoDGmhFOIV5UGVz1iRaEWY+MsMOcwcJojrClIVqYlC0D2FfQVIMkLCy0B210iTMzgdCRWrp4tcrwEIlNXjSddC5twT3ncxwJmcmYls7ScfAJRVZkU34AZsalFRfS7GzQd2XA1R79inilMfElgCZkr1Sw6DYVLDS6SQlbu9yfEHBPPSJyc+sSeMiuGtK2kwyH44ypBPgYwS2ELUnjLd2QR9AwwDVdfqCK9pUYNykXGGAyPqDG5VhRqDwJbWDDDNVs9wRFHC0QStywZvyOriQBWlXoh4Lc2QmGBqaKFVRXoJerigqKbUp5OyT-vAIoAnyM8DwV4CbN9BBgOR7fVuqCT6S8csZmCzBDIKyrlCVp-nYSmyOPTN9FCpedqieiviWF6sNC1Es9Wxba8s64Q9JO9IglPANWj4e-o3VFRVNLKYkvpP4EAbLwd+xffvu-MJawx4xnCxHpUUsCM9bCoWaanehOI0hPAQbd6UzUbp+tyWiCC-l+1AQqc1sxCurA9Mw55SrZUTTwHcHgbBBHQzYD1t63YgGZ3QOgOgr3kw5zMFmSzFCDhLqaSFaeuInQO2w0DOgkJSofwIZSZKCije4fJmJYr0zhVVEMCX0BNKZ5NhSJWecWe0nQnv8-G1rTloFg-l7QGwjwLRvbJ4bwSOOLw0Je6CRhaBalUQkzqpL8j4zHpS-V4H0CbCw0OR1wPKFxy6DEVhMqbfjhe3HZnTPFa7WaQDLYhXitGLfA9m6DLCZ8spQytpgJ0o6Oc9qlnHaM0oRTs97gQQeGFWA8F6sXGdWVvm6DQxMI5gOSyNvmPqhFj9qEAYOVzNNR-1Xwa2H0uKx8WyhX2HgKYH8C+5mdlaNy4gPks2X5ZrykEozFrirD94BB6wz8FTJgk8R85L4r2cNy-KwzMVrEdPAbXHKzYeR8-HLgJW5EGpdBO+akLAN8oXdcFtKxKEEDCJwNnwW9DkZUxtSGVWOyPV4LBT+V+M6F1AuwbQPOr48mZ1PRFbeADBYphmiGPuM6H3yWY1sFKp+bkpiGNCZasSgVQEv0CtBgsoVW4E7zuCtJfw9fNoDeW77ZNVFe-JpZooTbZkMcvA1hIEW8EfgEe5YcIl6GdA7zKVKA3lS5WUpMzlOFmBUFiFOIp9SQ2Id1WEpizEzDh8qkzoqqx7Kr5BLgVkitJ4G-AAgWDEYG0u8GmDvgk8ASCjExCDKc+ZqzYqUJOoMKBV-Odxvvk9ChBiKucwQTtMdCgIdZOUNtV7NDGTsK1AuB8BHMiLjF22vEbWK8HQVeIksWon0aaKhEeLu59QC-DT2mx5QvpKKfiHYF2FhJ9OZxbMQLPEyzrdRMI5fO9JsCfhIVpJboNq0vVoNmVDgUBKlGnVPyn1-whcJ9GHr5V3pIYV3PSENycYMc6bbYWCuZU+lX6wQb0TaQhG+i9AoojZYesQChA+UkpOQhGsiIqjTUvwO9DqB0SWFMNkwokf6JLVzqBVipQ4rrhNpe4KNNdajaaxGB0ad1WG6kecLEC+i0kaQEFaxtBLeksUuoYzM8BVGgEmEWoKeFeVGERAgAA */
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
          sessionId: () => undefined,
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
                  sessionId: () => undefined,
                }),
              },

              verifyingEmailEligibility: {
                invoke: {
                  src: 'verifyEmailEligibility',
                  onDone: {
                    target: 'email2faCode',
                    actions: 'setSessionId',
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
                states: {
                  localPasskeySign: {
                    on: {
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                      BACK: '#authMachine.active.login.idle.error',
                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },
                    },
                  },
                  signWithPasskey: {
                    on: {
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                      BACK: '#authMachine.active.login.idle.error',
                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },
                    },
                  },
                  authScreen: {
                    on: {
                      SET_CONDITIONAL_UI_PASSKEY: {
                        target:
                          '#authMachine.active.login.idle.localPasskeySign',
                      },
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },
                    },
                  },
                  error: {
                    on: {
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },
                    },
                  },
                },
                initial: 'authScreen',

                on: {
                  NEXT: {
                    target: '#authMachine.active.login.loginMethodSelection',
                    actions: assign({
                      googleOtpCode: () => undefined,
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      sessionId: () => undefined,
                      CCRPublicKey: () => undefined,
                      RCRPublicKey: () => undefined,
                      credentialEmail: (_, event) => event.payload.email,
                    }),
                  },

                  LOGIN_WITH_WEB3CONNECTOR: '#authMachine.active.web3Connector',
                  GOOGLE_LOGIN: 'googleLogin',
                  ADVANCE_TO_PASSWORD: 'inputPassword',
                  SIGN_IN_WITH_PASSKEY:
                    '#authMachine.active.login.idle.signWithPasskey',
                },

                exit: assign({
                  error: () => undefined,
                }),
              },

              loginMethodSelection: {
                on: {
                  SELECT_PASSWORD: 'retrievingSalt',
                  START_PASSKEY_LOGIN:
                    '#authMachine.active.login.retrievingCredentialRCR',
                  BACK: {
                    target: '#authMachine.active.login',
                    actions: assign({
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      error: () => undefined,
                    }),
                  },
                },
              },

              retrievingSalt: {
                invoke: {
                  src: 'retrieveSalt',
                  onDone: {
                    target: '#authMachine.active.login.inputPassword',
                    actions: assign({
                      salt: (_context, event) => event.data?.salt,
                    }),
                  },
                  onError: {
                    target: '#authMachine.active.login',
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
                    target: '#authMachine.active.login.loginMethodSelection',
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
                      actions: 'setSessionId',
                    },
                  ],
                  onError: {
                    target: '#authMachine.active.login.inputPassword',
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

                on: {
                  REFRESH_ACCESS_TOKEN: {
                    target: 'successfulLogin',
                    actions: 'updateAccessToken',
                  },
                },
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
                    actions: 'setSessionId',
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
                        sessionId: (_, event) => event.data.sessionId,
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

              retrievingCredentialRCR: {
                entry: assign({
                  error: () => undefined,
                }),

                invoke: {
                  src: 'startPasskeyAuth',
                  onDone: {
                    target: '#authMachine.active.login.signingCredentialRCR',
                    actions: assign({
                      RCRPublicKey: (_context, event) =>
                        event.data.requestChallengeResponse,
                      sessionId: (_, event) => event.data.sessionId,
                    }),
                  },
                  onError: {
                    target: '#authMachine.active.login.retrievingSalt',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
              },

              signingCredentialRCR: {
                on: {
                  FINISH_PASSKEY_LOGIN:
                    '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                  BACK: '#authMachine.active.login.loginMethodSelection',
                  PASSKEY_NOT_SUPPORTED: {
                    target: '#authMachine.active.login.loginMethodSelection',
                    actions: assign({
                      error: (_, event) => event.payload.error,
                    }),
                  },
                },
              },

              retrievingRCR: {
                entry: assign({
                  error: () => undefined,
                }),

                invoke: {
                  src: 'startPasskeyAuth',
                  onDone: {
                    target: '#authMachine.active.login.idle.authScreen',
                    actions: assign({
                      RCRPublicKey: (_context, event) =>
                        event.data.requestChallengeResponse,
                      sessionId: (_, event) => event.data.sessionId,
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
                  onError: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',
                      actions: assign({
                        error: (_context, event) =>
                          event.data?.error ||
                          event.data?.message ||
                          event.data,
                      }),
                      cond: (context) => !!context.credentialEmail,
                    },
                    {
                      target: '#authMachine.active.login.idle.authScreen',
                      actions: assign({
                        error: (_context, event) =>
                          event.data?.error ||
                          event.data?.message ||
                          event.data,
                      }),
                      cond: (context) => !context.credentialEmail,
                    },
                  ],
                },
              },

              passkeyGuard: {
                after: {
                  0: {
                    target: '#authMachine.active.login.idle.authScreen',
                    cond: (context) => !!context.RCRPublicKey,
                  },
                  100: { target: 'retrievingRCR' },
                },
              },
            },

            initial: 'passkeyGuard',

            on: {
              SETUP_REGISTER_USER: {
                target: '.idle',
                actions: 'setupRegisterUser',
              },
            },
            entry: assign({
              error: () => undefined,
            }),

            exit: assign({
              RCRPublicKey: () => undefined,
              CCRPublicKey: () => undefined,
              sessionId: () => undefined,
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
                      sessionId: (_context, event) => event.data?.sessionId,
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

                on: {
                  REFRESH_ACCESS_TOKEN: {
                    target: 'userCreated',
                    actions: 'updateAccessToken',
                  },
                },
              },

              resendingRegistrationEmail: {
                invoke: {
                  src: 'sendConfirmationEmail',
                  onDone: {
                    target: 'emailValidation',
                    actions: 'setSessionId',
                  },
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
                        sessionId: (_, event) => event.data.sessionId,
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
                entry: assign({
                  error: () => undefined,
                  CCRPublicKey: () => undefined,
                }),
                invoke: {
                  src: 'startRegisterPasskey',

                  onDone: {
                    target: '#authMachine.active.register.localCCRSign',
                    actions: assign({
                      CCRPublicKey: (_context, event) => event.data.ccr,
                      sessionId: (_, event) => event.data.sessionId,
                    }),
                  },

                  onError: {
                    target: 'registerMethodSelection',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
              },

              localCCRSign: {
                on: {
                  FINISH_PASSKEY_REGISTER:
                    '#authMachine.active.register.sendingPublicCredential',
                  PASSKEY_NOT_SUPPORTED: {
                    target:
                      '#authMachine.active.register.registerMethodSelection',
                    actions: assign({
                      error: (_, event) => event.payload.error,
                    }),
                  },
                  BACK: {
                    target:
                      '#authMachine.active.register.registerMethodSelection',
                  },
                },
              },

              localRCRSign: {
                on: {
                  FINISH_PASSKEY_AUTH:
                    '#authMachine.active.register.sendingAuthPublicCredential',
                  BACK_TO_IDLE: '#authMachine.active.register.idle',
                  PASSKEY_NOT_SUPPORTED: {
                    target: '#authMachine.active.register.idle',
                    actions: assign({
                      error: (_, event) => event.payload.error,
                    }),
                  },
                },
              },

              waitingForRCR: {
                on: {
                  START_PASSKEY_LOGIN:
                    '#authMachine.active.register.retrievingRCR',
                },
              },

              sendingPublicCredential: {
                invoke: {
                  src: 'finishRegisterPasskey',
                  onDone: {
                    target: '#authMachine.active.register.waitingForRCR',
                    actions: assign({
                      RCRPublicKey: () => undefined,
                      sessionId: () => undefined,
                    }),
                  },
                  onError: {
                    target:
                      '#authMachine.active.register.registerMethodSelection',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
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
                    target: '#authMachine.active.register.localRCRSign',
                    actions: assign({
                      RCRPublicKey: (_context, event) =>
                        event.data.requestChallengeResponse,
                      sessionId: (_, event) => event.data.sessionId,
                    }),
                  },
                  onError: {
                    target: 'registerMethodSelection',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
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
                    target:
                      '#authMachine.active.register.registerMethodSelection',
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
        actions: 'clearContext',
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
        CCRPublicKey: () => undefined,
        RCRPublicKey: () => undefined,
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
          updateAccessToken: assign({
            sessionUser: (context, event) => ({
              ...context.sessionUser!,
              accessToken: event.newAccessToken,
            }),
          }),
          setSessionId: assign({
            sessionId: (_, event) => event.data.sessionId,
          }),
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
            sessionId: () => undefined,
            CCRPublicKey: () => undefined,
            RCRPublicKey: () => undefined,
          }),
        },
      },
      authMachine.context
    )
  )
    .onTransition((state) => {
      const shouldUpdate =
        state.changed &&
        (state.matches('inactive') ||
          state.matches('active.register.userCreated') ||
          state.matches('active.login.successfulLogin') ||
          state.matches('active.web3Connector.emailConfirmed') ||
          state.matches('active.forgotPassword.passwordSaved'));

      if (shouldUpdate && typeof window !== 'undefined') {
        localStorage.setItem('authState', JSON.stringify(state));
      }
    })
    .start(resolvedState);
