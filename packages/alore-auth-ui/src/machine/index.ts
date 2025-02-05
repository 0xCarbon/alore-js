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
    /** @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBGACwA2bQDoArACYjAZgDsRgQA5tp6+YA0IAJ6JTR9XtPGAnL6NrdT9tIwBfMOc0LFwCEjA9EnxZADdyAEl2dPp0gEEAGXSALSpBESQQSWlZeUUVBA0BbS91a19TdW0DAU1fcw9nNwQDXT1W8wFTAItA+wiojBx8IlJE4mTCNLJM7LzCkr51cvEpGTkFCvrVX3VzPXNzXwEn8xH2o0HETX69Iz6PARafoTXwGeYgaJLOKrDZbah0fjCRRVM61S5qdRNTS-EE3HSaaymGyfBrqeyGIyaQGaVoeayU8KRCGLWIrBKw8g0dIAcXYjAAqgAFMrI041C6geqWbFPHoBHrBYwfVxqR56LrmKndUGYymmcGQ1nxPQcsj5VjczIiioo8V1dy+bFUwJtAzGczaTSUkmaAx6TQeP7WAxaawOWwGlnLY2mgBirAo3NYTEFuRoNAA6gmACLWk7Vc724ZkvSg0xEtraIK3Xwk1Q+f0GTS9QJdIzaR3aSMxaMwvCpBIAdzAACNTMx5KR+xIAE56PCTsD9khQMhsdix9IUbCMDNUABCpkY5st7DzlTFhfRCD+ll+tnUJj+7W0mpJ9NMv3U4wDj6pQW7KE2RNZc0j0YcxwnYgp3QWc9DAABbZBCAAG3SYgxAwMgADUqAodJYwATUYKhsFydJ8hIwpLX3CjskI89bSvSVED+V972aJ9-FMV9NBJB4-U8H8OkpGx1EAo0+wHcDR3HRdpznNIZ0IAAzFwVyoJDUKoFDCCgQgR1QmQXDICB5ASEgUgkABrdko2hdlQKHWSoJguClNU9TiCgTTkJQnS9IMoz0BcBBLIkPBkHFMpGMvNEWIQCsnQMR4+mfHi3xVBB2k-cxvwcX9RIAplDV7RzpIguToKXWDFLAZS1I0rT-N0-TDN0kKyHqmc4LEFCopU2cEJNezgI5GTIPk2q9A8xrvN87TWqCjrQvCyLouEWKC3i5R3BsZLUssbjeJJbiv2Ev8BEeCSypAiqXKmuDEL8owVOQCcIHIXD8KIlh8nIncNyYUjyMooxY1yLbUQlXab18No9CCYETGOzKhkxYx7nyzURKpa6StGmMnImqq3LqhqvKgZh+sIBD2BU9AFpQ17kFM8y1is2yRp7By7s2ZzJuqhSZvqzyV2p5C6YZpmWbC4grPW84YqRG04ph+oOkBRHAU1I6XzRxBv2Cc6Ctxq7fBu3nxsq1yavc0W5qpmmpcZ5qWa6mcernPqBqG7mgKJ+7BbJkWKfF536ddl63rlhWoqVzaVfzaGi01rxrB1750pOrLv01LGLtE-GFh5sbiZtx650ICAUM5Kh8ioZgmHXdhG-oBMobta92z6QxXmCIkbkmdR33Y3xQimSZdHbNpLbL6SUIkfTiDIBEhUYahLRoLgKAFOgKE75jYasT1vHLekbn6IkjAMEkzG0AQ9AEK76QMBxAhGaw58D-m9EX5fEg13IK3Xgh8dr1HvncXUokb62BGHfV4n5Qhek1GGHQoJv5SV-v-EggDa5mgtJkXc2QAASu4Dzjg4K3JuHck4Xm2urQ249-QEhviGfotJb650eJ+BwRJgjNEBH+TB5VsFL1wdXfBSYLQN2PIQs8dCmLgNYn8Lw48Rj2EdCfV4d8XhP2bJ6MkbROiaBEXzMCODiB4PILkbM2FcjsGYFQRg7dGCpnTFmCguZFFqyLJSL0-pQT+BSgJB4pg77NGsGMKYxgRg9BvsEMx41LHWNXjyPkRCMykLcWmGgABpKgDEfEML8QSR+KUvS0kiX8LhQwaRv0RuoPomIng+EJEk4mKTJEJEXpFFCgpkCwFgLZFwNA9Ir03FkGgZD3H5MKXI08YDGE3iJIJAI8MeIn1aLUtQRgxi6Dyt8TUD9ggOA6QvcRVjul-wisgfpgzhlgFGeMsg+5cjMDyUsvxqzfjrMJKEJo2y6x7M6K+IExzARv3MOcsRADrm9LuQMoZIyxlQBXrMgpxF2DJkYDQIUgoExcG8ccehKdu4-L+EGTZgLgwkkxHcT0KVgwmAMFMawNIYUWMudYvQ0g0UZhkJgJFjyTKTPSNMnJ6ZMULKtMUslCUzBawzqYLUFgfCsLvsbZ+IYH4srZaYgmpcf5crhUA3l4yBVYGFSM157zPlyq7gq-h2sVUCFZf0Js9JNV+m1Z0AQer4YGpLgHLBJqJFmr5cQS1QqHk2oxfM7FTA8WCgJRQIlXzyVKsmKqj1GqspGA9I0j0uqb76s5T07l1zIQ0DwDOMAYAV4IhYBwbMuwOAFAFOkSVcyikkqUcskwD9fisoCN+LZtKsr2GxLcCYPgA3svLTc01td-Y1rrQ2sgYqJXxuIieWVfbfHd3bI-Uto7Hw0p2QgZsfp4ZliVCOhdhqQ2iLDVcs11ba31vRbk6VibcX4sJVQYlooSlHqHaeoS47L3XtLK6Odp7H3Bski+ity6EjdVnJunY26f3zL3Qog9oGFUmC8G6B+TR-ATEJHxLKbpPwquMf6hDQbmRGtDah8NK6MMzjIDuxgf7k2pvTQ6o+ECSOGDiRRvoNgVUkjo94AkQ950sdKlbTp3LLHYDAFgCQEAaBgFrsueQq965t27Z44DqsiPH38F4Z+wYPCegBNYEkbTfBPzMB0ZojomiBEXSkzT2nMC6f04Z8Uq96C5DTd26V+GM0Kp6HcHiZJ-BtBPjfVzhI-Q8RmKCN4EYn3IfMRxqxgWdN6YMzVc4tqPnxePoqbwwRx40hsD3cJk7vhRL9QyJsPgej+e5XW9AykwApBXDQO56A2arHClzVT89YW4KGyNsb3kJsoXQLHW5G0hB1Ygcq0s7YoUZVk-mvLvw3VCNsD4DwA2AHLcIKN8bk2PZez0D7dAg0ZzDXm8akregHtPbW5Nrbit5DK0I-K2GTSHCIzdD3W4BhHQ0aGGxOzBJzBBFCIEF0d2JEYQwMKwcs4IA1ftZDx1x8QxeGS2YR07xMco9Yq+fQ-RyN08pGcwrt1kmVoJ+gInJO1ysGwIKBuXBGDSO5LIrkvJGD7pA1DiBo7EY0gZEdwkkxXNmD2b6DOWhIVen1NztTFy4X88FzOUn30CK7vkXt9wKNEZdFCKEJps6nD5o9HshnAkUoFspHjqxs1Kb5EudNiy8sbJ2TYyhpduCQ8rjD8vUH8dweJwp6J9wtgT3NkBGqpHOgIlPFLJiewBbjABhU4Tdj8fg8O1D+HsyM2o9zZr3HlJifvLJ5IKnnbhxM-KMSsGfQj5QSTHhoEAICDgzqhx22PwTRoUm4W6+0OYtu9N-ZrNmPz7it1-X47HvxA+8J120YQfyz7AjDGDUif9I0t3zaI-DsV0F9-CX0Hw-jfl4R45tH-2IrXnABLvKAY-U-dPXbUwS-VOWwKJYMaTJHWwLoU7IYVZO4QvPEVlAtFVL-UA4-V7XqfqT7P2X7WvTvBvJPS5CA4gCHRXSnfbEwL8UEHGV-R0S9SkN0RGIIJHP4HwKsPoL-WAVAPAPAOAWAFSVAFCAg6gWMeEMhd5JxdMFxVgApAjegrPBAdleGMYRLJsSFOBCJG+QwOwajB4FrQPFfP7A-WACQBmQcZAOtd2dcTcbcXFDMZtbMUoETIfOwVoe4FVG4DwCwAQiJKsM+TA3QDoXoIQuw9ABwpwt6MgfkOgRgEhKLbMDMKLZxcGSGHw5ZJHTGfKa9Qo54T3VHHQEFDsbAnwSwcsMEKw8g7lWw+wxwsAd2N5WrfIosHQO8N+Z0MwToFVdrVHOwT8f1XozHHLXAxojvblUAlmD6cgZvSPTmXfIA9TEAyg7yRY3TMAGgugqzJXRACYAke4PoMMZ4EYPOO+JHdzARX0N0N+TwZfJDHnTYhPbYqAXYz6P-HfQA94s3T4sOHYt6JYg4zaI4DQofCYG-THYJJjF0FzL3Hie4WBKwMfeo43N403RbevEE74sEvYwg72Ygr7H7dvffCggkn4-YtaNPWgjPaE5ZOwMwM+AIBwOwf4ZUVHY5BTMkZ4FGMJL-TARwiABI9opIlI5xGgVgWMegLI6gRgXIh3YYMsHEHQB+PGQEZE1HFKfQMMD8DoDOOwSYEUsUiU92G3X6EhDw3IfkegEhVU1krwMwB4R0DoG4O+dsXXZHAtMkX0ZsavWPKk7lUUq3S0pIzo8nZk2AqwRpKYBjTUK47Qb014bwAIJsPKXg2eWY0MgBUgQcbMJ7MQ4XDcLcHcLw7CdIJxTw7wmA68B4dsdUfoKkHUZsW4J-AtMYEMcsR4T0GkRDVjPfYA3BQs4ssbUs+EKgdgbMOs1UyweMpHKsb3ZoKYXRTHUsJslAxBdoBonE1ff7UApYv41vdYwEvE7-cWPYiE3bbo68ekXoJ+anAtdoJpVlJ-Z4J+eGUIDOIIGePAr4k87jd7Mk0gyk0c-EjfKmG8+k-ve8hKbcjzSkDsdsT0R0J-H4NhanAkCwDZL-OtWABtCAa84gFSQgb7BkpmU8tYgE3EtfQi4i0i8iyi8UJmW8hcq6UjJ4AMNlSwOwVzSYP0BwEMSo30SwGwL-Z6VCd2ac2c+chC2Gfo-QQdFGAcso1zRze4DsE0tpJpbE4cjYoEqxaS5mJI604iEGCiZUiGZ0sdX5LQGeNsPoVzVofQV8MMW4bVfEKSt2KMu1VUnQVlOfD0J4-wF8Vy5hSkJ4Owf8N4AysguYrYgkmWJIlY--NvEMyCq8+aPy5ADixS+oaowSI2B4aoh+XUx3R8QwQEQFLzZ8fcwyi8tfUA1K1mECj7ckuiw8g-VqvKgqhshKZoY2fKJ4VlKYNhQSlKQwenLQbA1sgiuAJi3KvyE89K-4xK-MpbJa4gEila1CcEuCs-Z0nWbwC+d1B4Z+JnRKH5XrH054ZsKwRkA86w6k6CkhQcXIRYGigAza7K0Aj6r6rAAa2Mxs30PZdlZMgIXQSYEYlRQkQwIkfoDOAIPzPM-6r4wG769as87q16+YzGz6xYDiqEo4hgxADOYwpAnhFgvLb0hG1lK6ewQUtGl6po5K96omrAEk0C32b7PG9m4EzmoGzAEGsmzQ003Xao6IlpLQO+CwKJf8YJTkzHfrdGj4qxFSbTaEKAWMWcGAbMKKVmHG2iv6jWvQLW9AHWvWmcA2o2sW5OcmhANyvZIkf1J4EwFVT0CJX0X5CwXoXs8MRqs24yi27WlYXW-WsAQ29Adqz2IgvmikrK82y262qOmO-Ko6yA1UppTodUAkAMKwFVPXco1iQo7wUIEJN8qYV4QCgk7kCQJeWuAgk236iC820AhupusAcArOxku8wa2GewQtcsRMjoD0bZa6+oqJRmnwMkHiV+BK9u0OzuxuqAZu8PDqsC-mkOy81e7u3uqPMHfu1U1RdzWwR6ssNXHk9wHibEAQr0HQeDV8L-KANeje3-VuzKkc82t+g+6gvuw4x2zQllc+rUDsDoRmyqxKTwdzZM0FARbNJe5O0Ov+9enurfFvU25ey8tBj+3vQByEweiBSu-Zf1N3RM-obXJpe4KkQI3oNpFKV+9+jB3-LexOgWpK3BPB1hgho+hkoB0lJ2mHH1enBJKsR8ToQShG1W+kS6oxcSdW0OwHVbKmOtT6YgWQO5CgZgCgH67+oyy8lR8WdRhtLRlCHRigB2oRkB1oUjEMEYE5EMPoUuq9GedUQMFpIS9pJRox7TFbExyAMxwgbR3Rnmzq8ClBvx4bR7VR5gUxzRkJix3R6x-tPxOxiTARJx93VxgMO8DZMJOht+ZBn+0OyNQJjR8xyxrDKZGZXDO3RZQq1iToLwZoXQcjZ4c+a65sB4CI+o1pYpoQ8ZCp4J0JvR6M0+lp9UUFDpnKdlH0EdMYTrHwAZnxtmrhqxcp7yeJoJxJsZ3jep-jHFQTQDSzYBofTwZoaZ9p5+TpqdH0cjUsB+fp7xkpwxhi-x2Jlcapr+88+i-7Yx7ySx1Jw9J1LQRrCFVlKkZ4VMydenDM5+MwIpj8RamJoHKAap9hkgnenBj5tF1R4Fwhge0Gp1J86KwU7UFMn0N1J0CRgu7xswOu6CigMAfSWAdAeqQUVAEcXSPAPJJ5HZyppJ-Rv5nqt6x2FltljlmcLlnlwgPlgVhJ8xkF6zDWCR6JMjcsToBA2FtA+FyeOkFKF8HwJliV1lwgdlzl7l3l-llwQV0ZlCEVzhraqCs1qVq1uVhVu1pVpJkm4h9wdp0sGwcMY5LM6l7oUsDwTHZVOwQvU1ymSVi16V2Vm1xV3Z8xp13elqr4xNy1mV61+V21+1vZlCDii-Eloe18O4Wq7oEwJGWGn0MkP0R+gPEwTHRl3x7Ngk3N5Ngtr14tjN3551jG7t81vNlNwttNoVu5Di6AitjWCYOzXSzob3L2n0S534Z8N-HiK6YM0pvenNsd3tz1otn1u5cJ7epO-drt5lo9j11N719N31ol1UiwfwlG74PEaKt0VzJ4GnVpD+HhWN+N75u9-Nk9qdh1i9jhrNo8w9918Dh9gd59-h-vUm85q-PKc+h4FdgUh4Vx6-ejAD4MIDk1zt-7MQWNJ5bkVAMUsgJQdlqKdkBmeqAACgEAAEoyBYOD9KPkVqPaOrdJm3VEZ1VMRn45numqNGtmlnhXmv8+ORUaO6OGPY6OWTQWOZxWPxOuOeOUlFORllOhOmmbwMZROmxxO7n5mspvh2I-x9V5PyOAcwPUlplWAPCd5sAaBGBsBWBswChJmEaVVbgH8JG35dWMQ-hsRn5dAQxIUawuwnO60EPXOZy5zN5xV6AKBcgcgOASIyIKIc74YokiQ77FRPAi8spVAkZYMdAkYPQWxXimr-nnOUvukyBbF7FHFnFXFZkLNT7h7kKstojvgR4qvP5SxcLWhLitBOhF1kuk36pUl8NiFHTyFDwW425aF-Wbw3UfcnLegR8l86VqR-Q+D+43VugmueOFu83Uv6B14Mvt48I948IiudDcLNY4EsPrqNArBH4UEehX8kdkb5uXP2updZE4sTOkXPxz0glWh-vXGNBbg9kkXNQOTOgkCweUvpWEJYBsBdNz3mBzRUjPPvPfP-P8hJmb9n8mV0LLApGqvHwVUAjcLlV9KMEkuXOiLdqmo-JM3cWEhbvpXeVlqfJmoVXji4ZMRolKl6Vj0xuhhVBdAolHhYHHg6iLBruhfWvFu5xee9qJeBesWuqbuefxf2KX2TPOgS90EmU4CQeb6Ghiv87jWtAqw6Gcf9f4JmpsI7lq4GScI8Jbd8vQZX2rAZQdWWehiTA6x2hH59ocZegCQ34LZueUvTL-fdIIAg+JmYffQvB+5UoHNx4XKqvCQ9ldVn4Yluhezve7us+A-c-ws5K5y2AvDX3JhE+iQqRkF3hgg6xxPBIfAmUQwCp2wG-Re+qBeh3zeUuZ-UIpenb7AphfheLNRug2huJ4-yx1RYv1eszvwp+lvF-HXTfInr3heXOz-l-NDgvsQVUTAaWHx9S6x3TEZ-u+heIbghz5+ffP0THS3KTjYCi5xcziJ7llxy7pAOAgVDsmMHaDMo56TmXfn6FBQpR7M2-KYCfznCACOWwAsnCoXlzZgG4gVJrMOh9Ihcb4oIIflYD9DFMmwkfceGSGerNceqIvJbngLAAED8+O3YunAy8qBAA6BaIfntyeZdBJ8yCSGjgPnASAEIfUbTKBylYzgg+c-XXhwNwFyCFBsgIFkexUHig7+Q+XoDoSJASNB0sXJXmoByj78XcTlR4Ewwz4ACtBtcHQRiz0FB8L+OLKJmBA0GyD5BLgpQUm30HnBDByyb4DoCeadAGQ4YHiEPzzhPxc60NceMci-iOC7uqAIijOB2ZMdScsheQowEUK0BvO7cNQqqShbVs2USMCQfYFEFBBvAVKPCsPTVrrN98vgxinz10HKCqKzUQXt4Ov4pd2hRvHtsEPkBW9UOx1GHpYDuAT1UEIXPhPHy6CHZXyt4XrMHXUEuceGLdbfLjX-53dNhADcYdnRM7GkGUZgN0JcUHi2A4hmMCYDSzbD541hfQvXnsJYZbCsGbdJ4b4P2Ep4X26HGxkPmNLuYpgHYZsIGmfC0DmwonSkIuTfjXZEuLQ8aF8NeGb146pJGDusJS7fC+GcceCjt38Ss4Yk48CYqFTiFskVUxgTEAbjGJvNmq-Qn3oCyphhM1BnwlzgyOYApNreO3GkNVU5LXxggiCa6t+EfgqpN+-CYeEDxkFsiwmngq9u8zpF3cpRVjTkfOwdD5wP40NGkMWmd6qAjsW5MjCWkxDBgZBCKFCOyIoCooJk2GOplKnmSQC3uilNArDjVxxcAQc1ZwBAmCrBAy8WgR0FSNYG7DReJos0RaIOY2isUxzADGmiAyn1PRLon0TSD77O9yw7mZ0WXgxK+hjRtyU0boxDG8CVRN4WMd6JT5+ifQZLG+LVVdEZi0hgYrMZYxDFbprRPaAoQ6SdIw9Cxw8YsYmLkzfgn4FgF0emMeFX9nhNYvpHWJeTRkiB6QEgfWXzGloeyRY30V2Nox3hgwz8NMdSEHFyjhxS3E0WOLRShimxAmSMcJjxHtjoii43zCSFir78EkkwAcTIIcJnBvINtaptvCiwphDm0PPEaEG8BA8RK-EAJP6mm7YENxMgw3iuAnZ4BkO57ZkUON8HgTvIkE6CaW2VHi0jBfJfiqFRGCgif2zPLgiYCpAEgwwFVTHIowRHEx4J4vJCWe3P6ojea2LWUbSO3EG8qJfbZCaEJ6IDxvAHoHoDXWMHAoksmyLoLqELxuhJRYHLTOVlCxVZjMdABuE3HMw5hAqsNQJBjGaz9AgeqA-ZFETgSmDMc4khDpJOCwVYws1WN8dFj4x2iD4xwx4I-38CxtOStnOsNeKRzBtbOr4MagZP15GSQslWIzCvDzFoSr8udRGP4C4rGkA8dYcur6CaDBsC0AhTcUxLaGfN0WPzbYdgxZEDCUpBLDkYcJPomda2j-NtuhTDDttaBc+JAnSAzjuhHQ4k-Ft82lF0SImXguCayOykNSlReUwRmk2vC2cX8Fw3iHOg4I3B-Qj4fsaBOrFLcEJUAEWtRKfYwT0pHw1qSl2mmzS2JNEjideChZOg+g9SPspUmcnkhr4-ZUwizlSHkTpIlEjoTNMWBzTp2tEt7M1MYktcrpRvNaZ63YmoSMORYKFmgOqL+J-alXZXh4HczMC4uy5d8ldEXRfY36AuB5MTitypd5KHfGcUFKLB1EKQ8MNMbZmJBZQPQvCeGIClZQTwOUTnGGRIDhlDIEZEAVJNOQ-EeIlJBUp8jYGaCWBww34ASllBuD6Ajc48eKdSG+DQz9aFM4AWL2ulrVFpBjJieTMpmwBqZYso3odS6lMk0Z14R8BnHuDHIZ0yYtnPxDsDaxXgkNVoPhTJnCzZZ8s6acBSamXth2xMGWaLMtmwVlZxLVWQlEfLflkaZfewQMCyhyN7gV0OLpjlV46AhZttEWfDJJx6BCyBAlwhWUUleIFytgINpmTyg+llUJ3BsDFKDCakmUoc2GQ7OQCqMCBsErcfbIjmIzYAhciCeXIgCbSEoZIW4E8zbLwMPe0DXUGr30IdAV27YQWabLDnmzI5lcouTXOg4MTbZ0kMuVTMHlVzEJNcuubDHV4SYcOzwMaRPRO6Oh-ZeFNSc2DmDghiAexeABUESr5iNAolCkG6SsDXYHAQ-PKC0CxnVJmwRovMkkCcgnzsY6oC4qvN77Wc0CkI82ORhio0h2m5aE+ePCH4TxEYrwAGYSFsDjxF0FcIWLVFnHoU+4DjQeN6KvE-jdAioPrFu39G68EFIcBcIgpXCzjkaOIOUHrAyjXVkhJsHGJdGLhsDrChCu2HOFMroRMI6AMheSALSULs4BsZ2pSILimwGF6fC6b-BYXCwz+AUNqMFCGDfTu45C3hb0CoU5x0Y98OhYVDxhiKmFteSRdNFMq0luFUSZRWlFRiCjNRwi+hUXB0U8d9F9sAkhLFpiRw2qxiihSov4WCj4cmis2IwrsUPREFT0ZqFBBYoIRIAbi0xaooEW3A9+t8kRTYvgUBKQ43SMhb7QHgFpYSiqHoABNBnsojc4ldoAGCDz5jWgz8f0LYODBeiXGwKZhJUgfBjVgg1IL-CktdnQ5v+fcT3oEFzQTpleZIFSsEnGCR8LO8I3RRsx5QmjrUTyC0bOImIdL2UXS9VD0r2j+pI2GS14P7n6DNKI0FqQVJMvkX-CB0sy-UvMr4SepL0HQCwGdzOHMCeKzQ0ZS6x5Qfp10MMHqQlkpBzKvQpy1Ptrjyil4mkQCv8pJSc5dIzU3GGZe8uOWfLul5yvvv6EhRukvQKUEYF-jKzGTpJ-kshaCA8YrN2UlfDsK5ihSazywTQT0s4xGV6dBs7U4HBtlnH+51+bORxqFR-msR2CFIb2bZOVTNKLcNc2cePHgKnJ-UWZKNggh-HvAbg2oJsF0BA6b5l4+Y+DKWH8B05-UYYZHAgm7JVgP8Hk3iVznEVr5hCohcQpIWkKXJ8x2hVnAnyrYpYmevJSEUjgBDuhV+rKWIq0USLIB8xSBdzA9TL4Ap1UCCH4I8DvEJ9guOq+5SO2gpGLWlRVXWDVWYE9xwqzvY9CVxQSdZtWpU80hGTaIsx3V8MatnJxQK3oro3pH8Snz7EoJSuX+cciWTAD5jDkuuJmjMAga9An8G81hPpUA52BpVMFT6DWvaW8RYk+HfxJ+X0AMZK6nvC5YtUdlkUKKSENis1BrUgzIFGq3dqYXOXxJ6hWgNpNrwCA68nhKSQxW9GzVflksXoCYoSCoaTo3KLZOAtPC1aWFdVcHFKnlXzFtgVKDXZ4NvwniuVYc3QMdB6HsEgiJ1lvYJXsXdUgjNZsST9jrmgZe07gCBIMiYmKb4Ld1BNAkljSwDPrGeMa0bu7XbBw0bwsCRGru3+C0hbgX+VOhHRtp21Y6JS3FeUpGAfwqlDwO+HrnOL0hPQsUz1DSJa7itKYXddBsfjlXatdCKUFpo5mLqaVuyb8GHChQFIFZ71B+LES8tBZU4Ow-oBwNSE1AbqPQ0jV0k2HUTdBIGti3XikjZE0TLGNGs4kFV-IOMcmPoESJuzCn4yH4moIZmihGYltzNkaw2LRqs0MbnGTGmzs40MDGzF2O7FzcCspX1SgWujGZdVWMEUs5OoICLolBuA05t+ntHKOqk7U9t72k7R9vdLlW3g1NTbBMd+3OWpazqeWRxtQI9AKcqOLgIzhAAs2K0KlNm6pTZy6DRcbA8Od3PMpwEnyCQQ-YmRJh1wgiPAjAmQS0oUXEZG5kjJrEGV8y-dMQ7EN+O6Cfp2rywMgvHgTyJ4oRZx-3M6jgRGB5R2UugIfs6FGmggUYu0wEOSoxE+9ppTMEpWBt6AdhnNu7DRHWGDBOhTtbwZBCnxkFN8c+DJOVUJVY11caktwLoPHzzprb3QSMLQHuy3G+Cz+cq0IO5hB6Y7HilgePr8vabPFegsmozZlIAF1ogBPKrzW4z37zK+Zbk5LdcAbDoDCi42+nDIIXD+DFBnQoISDsp3fAPA9wIID+Wowdhkee5bSWRiiGlpzpoaiiS5wyH1RshHLJrZTuJmu16ktgLDlqV35QJZQN8HXBNWJ3LT6RO1IYe4NnV+RZxbZMYF5R3YrlIaogvfj0B3nEyDcSGo3S8P-qyrKdvC3XKYKrA2AA52m5njOn9lupEemodMXVICbbMYtlO+wLLwDA3BnwTSf1CdyiS7smMJaRBHdpJ13cgxOY8ZPmIECZY7gqYu8RNPk2+DdxBetFEXrkyeAg2VgaYILsfA573dovR8a4JfGx7ptsMYvVlBdwZkV2QZBeoCDAmsSPpNE-MXnlHxpY-1LxIbaXt2nnjjZk+LyXmx8kmSZJSm1VtniujaUNVDcuRt6Ar5sl-gwXRgc6C43sC2pUWjFj3oOU9E+S3QBUFiFaS1hme2Ibfk-QBV-gyJMuy6Rb2unvTeWyE91caVLDKVKij5S9KoGMEfzfQq-OUOWCR3SyzZwA91VrBZmo92ZUQ5LbxFq6egugy5DsnnPDlTzEZU2x-VtKTmvhPAXFL0HqA-1DB8ZoUk0mxFbJvwyDA8iueLyWIlKZMLZP1JdhL56zXagekSnhVql9z85Nc2QZ9H0yaMSlOqe8CRnQr6lOZLBn8UjX1IKhuRiUlrpPLlmRzo5FO3vUVW7JultesNFNRnOxD-dId-BKYIbtLnoG5DQ86uRQeV3mHDYvmVXIXybBhtc42aC7O7V7IaJ-A3B0WYp2pkTY0g3h6g-XMcblLTSuoO+s8BO6WH9CBmrkr3IiBAA */
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
