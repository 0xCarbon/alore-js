// @ts-nocheck
/* eslint-disable no-unused-vars */
import { assign, createMachine, interpret, send, State } from 'xstate';

import { AuthMachineContext, AuthMachineEvents, AuthMachineServices } from './types';

const initialContext: AuthMachineContext = {
  salt: undefined,
  error: undefined,
  active2fa: undefined,
  sessionId: undefined,
  registerUser: undefined,
  socialProviderRegisterUser: undefined,
  googleOtpCode: undefined,
  googleUser: undefined,
  sessionUser: undefined,
  forgeData: undefined,
  CCRPublicKey: undefined,
  RCRPublicKey: undefined,
  // authProviderConfigs: undefined,
  credentialEmail: undefined,
  // internal marker to know if salt fetch was initiated from method selection
  saltFetchFromSelection: undefined,
};

export const authMachine = createMachine(
  {
    /** #no-spell-check @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBmAIwCAdAHYATHoCcANnUAOUwBYLevQBoQATzUGDmzTuMWB603oWBuohpgC+YU5oWLgEJGA6JPiyAG7kAJLs6fTpAIIAMukAWlSCIkggktKy8ooqCBrW1jrq1vaaBkECVqaaAKxOrg2adhY6pgJtHkZWbeoRURg4+ESkicTJhGlkmdl5hSV8muXiUjJyChX1qpp6pjqavbfGBn161sYvji5qI5M6QXsfQMAhefjsCxA0WWcTWm221Do-GEiiq51qV0Q2jGI0+QWmrT6AlMgzcAk8LWsrWM5NMPjakOhsVWCXh5Bo6QA4uxGABVAAKZVRZxql1A9QMVOM+iammswVMNgC3yGqncHW8NJpfWMJnUr0ZS2Z8R0bLIHO5fMFx2F1QudUQkvU0ve1jlCqV9lJDWmfQegVaHwsWluhpiKxNZvyrE5mSFFTRoodCHcFj9-RMwPspgM5gs3rV2l01gE3V1bxeboMYZhLNNeFS5AAYqwKJzWEx+bkaDQAOqtgAi8dOdox4sdAj6YzsRJMk0+NmsBc0xj692MthCmnUdwstj6NeNcIbWwSAHcwAAjdTMeSkBsSABOOjwd7AJ+IUDIbHYTfSFGwRheyoAAhdRGGjWN2GHSoRXtTEEEeOwHgMHwvlzHd5W9dw1x0PprGBKwp1GatIihI0I2PRsdAva9b2Ie90CfHQwAAW2QQgABt0mIMQMDIAA1KgKHSJsAE1GCobBcnSfJJMKWMQNk7IxJgxN4PHRDTCCFC0KMDD3gMbCQTGfDCNMYjAlIxZw1hVkTzSGirxvN8H2fNJH0IAAzZwSCgKh2K4qhOMIKBCEvLiZGcMgIHkBISBSCQAGtWQouz62o2iXIY98mPcsBPJ8vyAo4zjgtC8LIvQZwEASiQ8GQUUyjUuCx2ULETGldRyTuewDKwn4U38PQdEmczLKCQ9KPszLnPoxjmI87zfM-EqgpCsKIpC6qyAKx9mLETjGq8p9WNNNK6zZJy6NcvKdCWorVsCsqNsq7aarqhqmuEFrRzFdrEM6loeuVfqjMGyVczwgjOgsiwSKm9Krqy+bcuYtjSoMLzkFvCByCEkTxJYfIZMA38mCkmS5IMJtcl+9F-vqW5-kVTx5UMcxDOw2x7jG2GJus8jbMuhzzzm27FoK5a-OYI7CFY9gvPQNbOKx5AYri9ZEpS87hcjUXruyhb8sKlaoFljiFaVlW1dq4hEq+i5mpRBNWsZrELEecYCL6W4Ocw8GhleWxofG+GrMRkXZpunK3PuqXHvNuWreV561d2x99ufQ7jtO3Xa316OjbRk3pc-C35cV1PMexu2Hcap2fpdkcGeTEYvZsPpfb6zmBqDiYxj5ojw8msimWmjLT0N1G48ICBOPZKh8ioZgmB-dgV-oVt6aTBC5Q1N0LBedRfd8SxsO6rxUKnARc3lGx5jHi7C6nziJDC4hzQYAVGGoWMaC4BQPkdAKA7w0gDEsbQ8Kggss8E+HQSSDXlH6EE7g8SeEnBZA8T89ZUVfu-Eg5p6C5AoJ2bsNAADSVAJKQTjM3WCf1kzOlePoNc+ozABjsEuQatwLL6D0F3N0jxnQjEji-Ryb8P6JHnuQWhPJezZAABJAVAjeDgG9V7b3oepNqTMqReHeDqTwPh3gjHzDwncuhVyLiPsgkI1gxF4IkQQ4g0iF5kHbDGZeEEYx0JOAw1uCF2bpjdNYXoa53CBG9LqAwOhgjGE8H0fUeh-CtEcTNfBUi57uNyAOASuR2DMCoIwLejAuw9n7BQIc2i3bJiaCwgI7dgy6kCOYoY2l1AtBCJ8Vc8oCKhhwQXJxCRJEkDceyLkPJMhASUWU8hVDVI1MYQhIwegvC2BLAI4EjxtLehGHw7S3QiQ0hBBs9Jk9nFZJkV-Zeq85kVMHIwbADBFGsGqf4nR7sUyGBdPhSUt9SzkgIns4IzQBGPHlPqI+wJwiDKPBky5YzsmL1uWQh5VSnkvLeUcD5tSEJaElOMCYJgOi2BBOoPZoS8IpPsLqJU25zlXVGa45FNzN73L7I8559BXlDgMLi5Zml9TyjwrqUsntDJym4UMfozoARWBCJYX2U5BbjyRgbZl4ydDSCgMQXsMhMD8mQLAWAKVop-iyDQZR5TKHUJ8VBMBujEAn38HE+UntyTOjeE0bC3Rmj+BzDqSwJZsE2SGQikZLitU6r1Qao1JqzVkBtQsxg7AOyMBoAKfkrYuDvNtIEzSrxgjeBXK8AR8NXgDAhpKK+ehQR7jMcSScjKNVRuRdq0KsasDxtNWAaKIFcjMAoY6r5nQRVyl8Ckqkhhz4Qz9Q8GwuoOh0rSXCieTK20yPzjQPAj4wBgE-ha9IVqOUprkSOphY0AQfAmNod4hlEFBzdCNKkh9uiGFxKq5+wydCavbdCHde6D1JvmXatNTBM38mzaQqgebXaCoBtfe4K47i4gIrqYM2FAi6DhgEMw1iBB6BbdRP9W6AO7v3Z-JELAOADj2BwAofJ0inuoRe-FoJmgdFQt1Kkt9OgqkdIuloaz6mdFxGmYjmSkVbr2k+MgR6T3JrteepZBaAZbliZg7StL4bkmwtoP0lgNzd38N0OUknEUspk5nOTSmJLgYzVmnNsG2OFuBJ0hJLw3jEUrRfKkLQ-k0hPnSIIj8w3wouZGq5C9f31WQJxHtZqaCdpAz2FNDnIPQdza59TbpdBH0eD00sCSBFYd8OMKcpjtJNEgRZqL0mYtvwagl41vbnDJd1WQAdQ6cv1FaEYcY-gCIWXMNoYwFKIavoBJWk+ayj5Hzq7F6LkbmuJb7R1w9uxFOgZob46Cqnd5CvLXE8b7DPZ2DrdKx0YTeaWA8BuEEioiNrvVSRqNzLsBgCwBICANAwALxPPINldybWVLgy3Q7ECBGac9gRecxXH1YkVLErubNtLw0VM6RbmqPtfcwD9v7APRRdcHcOg74D6htCgXmFJ6o0wvD2V3Tp7RX0zFQgyF7UcpOuL3egTyYAUh+RoPF9AGs1h1R1mqrnlmdC8-54Lz8wvOLoDrnF76QheuIDaL7PC7gQT4V1DuPZxIvDBmIqEGwF3sdRrl4QAXQuRcZyzjoHO6ATqPjOlL8R9Wedfflw75XqvHbyGdgKtTlP+jpkCLcexipSxVqGIYTjOofD9CPrmCw1usm8QwD2s8T4IAk56+Tp1CAqT4TiRNMJQRjDejTJ01mtw1wnOQVnpFOf0B54L0X4dNp4Ph61ze6l-RtAdMsAJhAG4RqKs9d1AIw228so713x8he2DYH5MvLgjBPGcm8RaKZ+2w+Q8p4qZoOZSwdNlSMPZhI8J0g6LcI+YqwtC3DZFpb7e+Kd9a-n1fglhJRJdsHUS8vkPhDBvYmhgRcxPMJshg7BeYqR4YkktAuhNBF945TY-J8gXExd4p7ZkpUpcEI1P9XEHozYcCP4g8G4Q8m5j8KdEA1w-BRpUxnRAh8IQgE9EBfBmhb45RtQYDPZX8vcf1NVyDsDcDYpxcCDJdv0SCxCE4KCXFqD1ccV80T9GCdQxgaRgxuo-Bgg2luCfB9BnQdxuojACIqQMDxDPxKDCEpD8DtYiD38N0pEbCoA7DiAVDG4Nd+V1CGCEAu5jCdCQhSx9RZ0ZUwiARyQ7BzDDErDOdvdSDMCy4PDJDNYJdnCItXCxl3DPDvDaCNd1B6DS81wKQ8wklyVeg+4sRmZ9Am13BupDAhDrDFCJCP4ncDojo3c84RD5Co08jlDPoaDiBQ9-DS9htmg8QSxJgRgpw4DGDtJNQjBSw1lb5-BjAMDYBUA8A8A4BYAvJUBOJPDKAqAmxERlFB0ikewSlWAqEj9xivltB-l5UT5fBiQkl8JvQUkxh58Ht8JZgzAtiJAlYzxkA9104fw-wAIM1ewaMBxShQDkxfBeg8JtwUkXg7An9vjPYdAmg61vUdw6QLJgTQTwSwB05eQ6BGBFESEBxewSFikaY6YkSEI7gNwAQYk1lFwpxEdAiBE4kUSSxtwn8OhST0AwSITsYe9NcEAbB+gWgcw9xgw4Z9RviwkHhZs0xehuhPZYVwt11W03C2jPw1ZcZyAHCtZCD85sijTciTSoAzSfswACjRi6DHjkS+oHg+k9xekIV1T1l+s7tPBWhhC5CP8FCsDTTsZzS8CrTZDiCIyBiHSnS8ZXTmo+8IcAiaRtB9BPhpgQ0aiEATARoBF-BZVYZJgwzEyciyCUyYznTOjs5uj3dPdwzayUjE5UyXThjVDWTNIUTkN25txtIXgPA68dQ8TgRn1SwqR9cMDMBwSIBJSKTpSqTikaBWAmx6AGTqBGBmTZT2TeYkkeZhtZxvRRzNRxsSxVxu5M9EjRCo1FzV8Vz04CYgCaS4TcheQeVZShTRodkqi0wj5vQdw-QJgmcPhQRQRHsFylzXzpTusycSivku5zBRUjAJhj4pwrsEBLBTI-ALIPgQgVTQ039bS3spFSAzwBx7c9jvwOBoTAIESBJ0gil4TESULkwNwvZQQNw9C9SFjJ9-N2ZwihCwL7yDTXtucdBqLaLBd6LEQqB2ABwOK-yzBOkwK61ghsRDDEIYLRp4YzD+CNxCNWiozzZGzLTMibTDTKL7SLLzT0z3T+8NDJ9PhTdUJVxnRYciyxy4lQQUkpwu5PYpxzLUjYzZNmzc4PdbLpKZd3CnLeyfDZSp9mcJVzBUI6RUJjd9QHg8QNxYF4iMC91YAD0IAZZ5AvJCAPcRiVY4ybK+ikypFSryrKriBqrarRQVZnKNd+yAZ4YNSqQtBiIHtOg9kpUAQVxeh+tgxm0Hz+ipEMYuJ04lKVK1L+r6hy1pR49Jxm83i+S5Q5VdMEk3Rkk3QMDlrVZpT3yiZKZZJ9zaZDy0w-RCNb5gRTrAhDqvL9Bn9JRsNyR+hLq05ELSdZTzAzA8TiRbAIV-jb9QRFSepPBgxPBnspLpcfdOyzYbZpTrKZCsi7KZL3CcbkBeq-y6QRpPhAVMJjkJ9twGlH86RoK9wAhwrE4SamyXcWzej2y7S6yLKSaybNrEB2CRoj57AtB8LXQJq616iJhGjCMxNqyXC+bZc4A2qnpSpYy8anC4qMbkjWriAKrNauIkqCDg83S+quK2S7hdBHg-YfA74GceFD4KsqQQtRzqs2azZFEzxcglgGr8a9akjIzUjfb-asAhbrbNJPNwLcxggklI93BQLIb5S9xeTtJVlva-Jw6A6dbrSmqOz3Dc7I7krCi1DXLszdxhM7gQRViasU77g06CIehAQ0byLCaEqHSS7MBObXdWzg7HzjSLKe6o6PSEIeCUFNxvUJgSwhKPgvBgRyRCLfYoV0CFrmqxkvIvtYQoAmwnwYABxGp1Z86EyVb7LXFt70Bd797HxD7j6x7K7S8dxgxfrPhLEz9YZviQgoaoKQ0gq3gMCr6b6D6wAj70B1YoquaYq2yazVbgHVg97QHwHSay7LbZTnR-MrAm9ZjcxStBp5ToiCTugmbSx170aQ7kyLLOQJB34F4TjT6Cb4rMb3CaG6GwB8i0Gxin7ULehpRPAjAdQcJ59KU1lvY5QjEQyOZs7Pw2GoB6HcCoH+6ea4GL6sa-I5GFGqCuGXKsyJi3hB456zN6QrBKUiR9BbhK0Fwj5laKKZKoBaH5GOH0jpDdbC7VaHH2HOHzaRjuG9HULEk4kUNrFcxiRDqXUWhVx+CRq8NNiN6OzPGnGGGMig73G1HEmtGSAybMyAk3L8JyRvADGSxkDuo0wQUj4HggVDBvVDAjAMCMnnGOilHubYq0n7HHHMmvCdGrbx7NIyVOlXhsR+kUlHgQViQTDPZ3AbAgQkkSq-c7cFdzY908ZiBZB4sKBmAKBA63Hea1Hbd7dy5lmD01nOINmKBH7-G6knhRoL861iUyU9k9wrE5iP195bA5m+cFmZYjnVnCB1nNm+6WnYHz6ZL9nFnmAfmTmzmLncmAiwkKRadE6BEEkcqeE61OlCNUd8zam7gtjO1vnIBjm-nTmAWFNrUdt7U-FemIEWbRpTNnRzAcx+hfUKROhZzV60xSU8XdUCWVmoWAWkLZSPrmgmhMFUJsQElHmcxNSdR3gzNhr262mZcY1eWiX-mtnBWcnPlkwklUSggnndWj5b49kzAwVOgT5fZlQRruXiBVXfn1XUtbV7N01MtnNwdYXSjJgwU6QasvXtwuDAZtw6XyQCrvMyKlXMaVXDnCX7WSWtm7NU0XWnMYMhwtW8VNJfZeKYF8QTIggA3HhJwiUQ28xJhbEZGoAKAwAwpYB0ACp+RUBLwQo8AKE+0IWY2TntmC7dmiaHTK3q3a3Hx63G3CBm3W3IXiWYXtWglsH+EFQqc6QtBjINQiQRzkWKxHhy2+3CAa262G2m2W3nA22+XiXO2z67Gu6LKt2d3B292R2D2j21XOJsno6IEUXdJIU0xwUA3UxYk9Q82lUOhZn4nVb3Cr2B2h392x322T3GHB7FqHLUiwPd3h3R3D3x34sya-CeG6kzBB55SSyPAX6L5cIrAuFNlxtN2q3t3wPb3UOH3Y3T2mH9bQ7E4kOb2UP730On3um+BijqX6hZxpRzA3QnhdQwkhLIYvBVjWZiQjKv1VGe3L2qPr2IO72oPj34tAWYG4PN7+bEPlOaOOP1PH3J302IE5R7h+ltIiQklJwJPxVK9twzqQy-BbHO6WHe2DPkPIO0PoPNPmntOI3kjQOvP2OfP6OTnn3+PnVSOAQ1wnt8MTBA4PYf62gfXLBQQBG3PmG1b+2Cpxkv51q-5j16AKBcgcgOBJJpJZJZSmgJhRpQQ3hCMT5PgA2bhTLvB9W0FQnb5FXu3HI908vnxWUrVWA4TAFsAaAnk3kCghX1irzUcdwJGJ81R3rK9FQVUrAwnJKO6cvBvqP8vWVcl8lClilSlQdBwhX3BdA1k60rBUJo82vtxmDdQXh+gM8vMHFgPqJ9vr2Cu5EZkeUVEwJ15N4tEX2mZfAxgP1ghAUaQb1GdcIYFXPJwpQu5FtfuB2CukQf5iuAFhJgFhJavAhpRekfA9qZg+SbhbFvBQggxZwF6MfQuCvd9vEVMIfGCRhmdAhDBdxbOnugs8S9wBEsFg53gmehudAB3WJYBsAftNPmBoxqSJupvsAZv8havPgRoATWg1lbOVxlwzA-QTGCJzCghWbvup5Mf8uyqjbipnpGOdOrprfnxbfjb-JnpTOEMBP708SRERthtmXBobgZjRp5R9cnQcIJeDvXeNaPfSotOejWn+uEgXftU4+eqePhay9E6UIp0aVcQnu1lpRn9LFn1eedugu0+rqBJ4s54RiADCYJJ7qNfs-Z7-VTF6Rbgb9g+dlkMAx46dQb1K+U-cuY+WJnpa+QoIAG-BXs+PrYkby1wzcOYVv+h0K0wQQBHXhxsIRLeBvmea+6+Z-ic1rVK2AEShW7AcN4ZbhtdcwDfe+UlLOXrP2j5zBo+-viaHfYOq-mfv-SoXvAfHKWX4nZy0cwbSDYGXBm4ZQPgQEG8HVCf8seAAriI7z-6S8UB3HHxqoTTbe9EAZ+P0Poi7hrgzq8MQ3oRkiatdfYCSWYCPwU4H8MBDpeqr-1H5p9MBmHDnnKVQwAhGkXcSYO8EVCG89wC6HitfGGwmAkB+XTAYnwHroDx+7ArPpwMDRTEekGJWxGuGXCZtRodabQB8BbqTg+u9A1PszwoyNQwAK+NfKwA3xb5ikePUruV3SAcBDyYmOLo8BMgG43Qy4RUJZ0eBvAgqcAhlPv2MGS9TBtbCwT3luKMB0gA4ZeIeWeJEMVUxiEwMCmD4eBFQDXAFJ0DFQGgghY-P7qEPMG-5u8c-TgXWggJ+BLGhGRpMa1SFVDvAkoR2luHf5fcKGP6NPq+FYiHQvsfkMDo+Ab4sCjBeQrHh0K6GyBPwvQkYkALcqcJvAncSdHSA3C15e+Z+EtCNla67gtAkg58CMIXhjCK2BnPocTgC5J9gW57YIePx2HdDxhBwyYYoOi7FlKs4wFcMwhJROdoBIcGAiuAXB3BV0rQkgmn1QBlVHwbbMwYXmoDnFaAlxZgNcSm5bx7if5EYCNApoWRb42VfwNAOXYmAG00NctFsLVpu8ehNw7qj-xSY7NBhafQ2u7wmHEjABdw7DghDQpjA3QUTRUEEFuBeDdQ-oNlrfHE7uAWhu3fWmnwabJNXGXbckcz2FFDFsBKVNvrfDGBK0jAc+NgtANfqrg9qO4BJHxnk4gsGB4-SUR0QGE6jzhf3fUVkx464DgBEwbqKNHwhrJWgM4MwIbzuCGV-qq4B7kSDoFGihh+XU0Z-GOGyDWBEojpo0zNHSjy68-fjJE2f4wwUSyXYYGmGaA6htkpid7vNT+Ef4KR8zA5ubABaGizh3o58GCxlibMphAROkEkjwitA3qceFGgWAvzeB3qfyCCvYDxFFjy4ALf0Soy9GZjPm2Y6EeczpGXMEI2kOUN4HdqLCQQq4JYaqC15xJK0tOF4K1zibpjnezPJrPFn7EbZ5MW2clmljtR2Cie2fbqONmiJ2AekYncfAWFDIAhMI+GBnk6DxHrjOIm4lLAmwyzJtss2fLyijmYTmBQyljAsMRXqHQVyQkMC3iuINhp8nxL4zrG+KTZQY3WFdIcYWgXD1EdQpbcVF6GD4kCbxoKXMG8DjzkMBRSRKCXFmfGbMtxJQ+4ceM6RQ9OoWvJAit06CaYGhd4wjH0my6Ci1xZEs5luLJYsYJI35X8keJDR0tFx0NNLl3ALCSgUEpKExDAkMj8i5Bf3J8bxJSxIVIh0Q2IUeNBC0T305494JeN75ThKBC4NUYpM4kkTuJzWNSZ1nXJAJNmVAcrsUiuKsBeQnARgCBB-KJsmA7PaiUIX9AYZhSNacwAWE5bTYA0+iHmAtlyFp8wS5wT8LfTOZEISEaKJ1pSweL0ihUmXOJLXXN6rgMS2EaUNsjPH+B06NgbUfmLT4EjPwqnPABFxg6kixR3Y5njVKgB1SGpGHQcR6y+Tlpp86dKscqHGxhSrAeJOVmUWbzQ48RbUjqVxxkFdiqprUuPrNL85YD64fZJQZ8F4IkVSUVkMgcH2Oy8l9IZhMlK2NC6fZvsv2f7LlAuDA40pYOcGpvzD63oeMgILwQKVvKtAsEsCGKRBJ+7M8XeF0-HFdKJy3SAEqUgSb-CoD-xAE4NcwIQL8AeVFh5aZcFCkpC6lxs+ZM+GdKG5AyCc10wHJ-ColZSAYVolHMvx8oeBm8qMqGHWhNxYVP2hglqZLzbEVtcxTUs9u5wLFq1exizaFt1KnaaQvqUxXwCgQ+AmQCwhkgEMi21BThTKlUrmT2P9zjCOxNmaKicKd6QSAZWYvmSWIFlmctqt6SkDfGnKZ0hKqgKUDePeBsSLJ00uPhHUNS0dOpnENAYGMl5tSHZK0jTmtLVwyjOB52dMKjmDBPNi+T3DYnhEIiIzGuD8O2Xb0-CeynZc0zscn3FHuz7ZSwL2SZ31l4CEAAc6bD8nZzsTzZo+K+IkifwBBugkoPEWIFaxmoQRtbCACBAwDsAJA6AB2USy+iQAIhpSLSZxXuG2Bxm24YMNHkVEmACwHCEwr7ATr21TEi2d3A4x-wmo-8EAbHspXP5vI+5JMraqOJzKdAWaJPX2NJI6CdJPAzwzNqBI5x-Sp4881uRYIK5KV7pl3efiWCnJ3BfYtIIsFTxQy6BeSrnDHB4CUmj8b5i82AMvPT5xzLKeMV2YMOAV3y2pZtdaX7PuEdAICFnRrliVXB6VCwxaVBEIi+BEk55B9W+UUNXzgL3ekVNWdAw1lBdYFJClefAudKljS8oVPEujgCBm5xs7waSZOC6g8jgKOoefPqWIk-paFS8gvLJTABnhwhUJf8IBAu5VJDygQQUs1xhT3xbA0AnXEERCzPBsMno-MaItAXiLYAyARZuELzFcyDFYC4xaYroVMKnix4rpF3C2QiICUGi+UVottFagmghCu+sQrEWkLrFfkcIcnNOEWKiFICqxSYqCW2Ls5wAgMPUJoHahMEk4ZcEl2BgX4QqD+bBGRGIDOl4AFQPovcI0AvBKQ7QZiSQ3CTSSqc-CWYC6mF42BzkSQUWEUvFYmFJwy6VDBwm4UnxDKxJRJOSl1B1Z+5TQV+bAg-mX5pJ4+KcvMUfxBBNki2FGBLEfDIKhseJT9PAjPh6VJxxvYzDOCJCgSFl4sWOHdFfDHK-IyC03g8HdCgxe4cY-5D-JjFwwEYuQxZccvRjPQeI3+C5RWLZh4N-YXMCGJ8TD5hxnlV8xyK8uNjqMTaL0CqFtCijfKT51ynuAHGwiKhipjygWIcpjiQqrq3ZBFVcvvjIqAVQccKUPCeURwXlRyyFYlWThVwSa+K35TcpRUQwfAfoMyPzBHgKycuEKkuBPy1pVUaqrESAAyqRX-KiyWgAIMCo5WgrhFJBHlbPBkTfLSeYqKnHqEVr6ZX6WgAMG8FDIkNF89wyGJTVLTeYK0UkiGBSGoH7hekI4syrkNIwLwDV2uEtF5nLR5t82IzaGNHmIqpgfAGBdtDGn1Tdpa5faA1V6TGzaBLAVorMCaxKV10iwSXLfn6rIxLBAMlGA1fiHqITpbA1TUZhDCEwo8wk8oeSYAsGH2qEgUVdNdaIQFyynmPQXClMwbxJIXgC7cEOG1H5lrYsq2YNe1k7TUT+kPA0Krh0JDTjBMHwOlkYC8xyhCMREoLjjhcR4yQZN0tqILIgQ4QpyjSfRKOTpowxZhVkE8mZG6AfNlZUAJXOgH7n5kWC5vB2uv2NwaktAegywiEFzBCLZ1baZfHQv7lrJF6hVToAItCp15nRXrPjNf1AlMz8xLHJQh-HuEwo-Q9gFErOGDmvA68L85IUChIE+AGldqqNNsV2L7FDixxFxMgtvjGECU9NazqGWiTCCeeD8IkMkmJDikEKyAe4V0HuCXYi0oTDUYzllptBMF9gQFIM3LZ4qt53BKCoKT3Dj49Bnsb4h4CnJKogiR1F9e2qfLwVySase4X1BdCjBTqm4VcKBQFIQVNwW-NMIeqw1UVJF8lEdmAGY3IEHg2DP8WYgiJYhVioqUIqPgqF+By25pe4UumlCm8NleDEINEhXBTlDchIDHLarBWY1KR7VTquxBpFcRvNitCrCQLwyVZcKiSQgfqA4K9BQUoIYGjXCY3CbiyEFOlrz3vRMER1iECVeuvdrQEcwgy0zQh3Zog1CtyEgajARtHuYh+CSDoPDRwxcYT4lhVGoptLU251aEClWF5qK2GR0qlhZAnTPS3ep9A+uS1ntTgHlse6zGwtWJoe6EYZwcYpbuI0-ZEhOYy42Vbpx0AIM-It9e+hA38laBxG-Sf1sU29DuZliNKPEO8D0VcyINGjYMZ4X7nm9BS-QKfPhnLCUog2DMoeWgkMT1N-thGorYnXTA5hi+F+BJBZAmovyvhJYHCBuB4JHqvm0bb2Wc37n9YKsitbpKBKEo4MoxrzNcH4MslD0xkUbJZqtJJ2I7aQYfC7NiGX6Vb9kBiGJHlmERHVKOQ3OqZx1Wn9yVwxYCmhl3+SeB9M5jZmLLODRAlYpoXUNSUosjZhjNZ2SZaWE1KXx4Y5PNMedtXGS9kU0GgwTUq+BpUv5WIm8YRGl2Z0Z1bs8ftL1l7y9OIVut0GH0nCzFwUPqVIduAbzljzCmdX6Wbq1lpyJtz0fuUCv6BTA3umLXCjcGComEbskKRVNpDxFH9p+IxaDQgXXUKgsRVOJ7tM34QCD48oTUROrsYEC049RW6ZtoQPnvU7gvQVJbfCmp8NbEWgPbXiIKEWD1N7E6BM1x4VN41+3gtZSNkOT2jggA+iQJ0N2GEj+2hw8BCuq2o6q-e5YFAp1HL3pCRObCYavvC5VcTJegIgqPXOFVFaugsSHpBaz1yVabgrIvEjMSy36FfAp+qySzPG1UiiRFwFWNBoaH8IB5BEQwJXNSU2ATsNWDCD6rA2KygxXjBHW1oE4cFDK4muGCGi-k6FCmk4StHDkj3KSserM-sfcI25SdcO9IRoj31VA5gT5yLFmpALFJ17x+0Eiib2qK1jocMfg6zvoR8BXisGt48sexIfEsGVJPE9g7qnTUvztdfPPg1gsnGlLTq8McWjzDxHxS9hSUzZtIe4M67aNqELBe8Di66FmJ4B5orHPd6ZzY26myUPcGF58xWJK3FQzKEMkIEZghgHGTHwXWE4l1-0DffgMtx4kZJ82KmWv2IFzj7Et-KFA1si3czWZ7OlAyLXYSDZ7uGGBlm11npC8ZgIe3wBuBLXMzx+HsjOYnMl036QdTwug5LUT3FzYeY4ywk4sSHVzu1V+xuc3NbntzfmnciANSyYhiA1AuHbQcNCS60gokIABeErEHzWi1k+kCmqWicCXhW5TEViP0ZBCDGhpW-dhU4E8hQBMAZ6nPuY2mMcwfN4MM8HPCwBYgQQTgTAGAFCi7Gtc5iSnLxgsYzHjj48pYs13WMjHvtOXSxQXnPWL8CJ78+2hMtSHTAWC7mVCIM2DD5H9F4Su+ZbsR1KKqywVNlqwSPnFpT5p2PDJ6h8ULy4FcfKbYkf0oCkqye2zuI7VT0Fl6iNaEnlYxhNhLfFES8Ra+Dxh-ZVmyC2cBVg2LicwKKS4PYSm0rygm0eglJLib8WGLSF1FIfU3pGDjBdSqOETHQY0WxJcjOg9+cXy-0iK4TdC7VFEtqkfqitBmZoFTPfpCNqsxcp6aqfJDqnS0Yppk6Qprn+LfsJi6-UScjxi0dwtKe2oGgtOTktkP6uZcwfTFEAa2T4IYESc5E8xbOW-HmJK2D00hr0BmcFF5VhQRAgAA // ... existing code ... */
    id: 'authMachine',

    predictableActionArguments: true,
    tsTypes: {} as import('./index.typegen').Typegen0,

    schema: {
      context: {} as AuthMachineContext,
      services: {} as AuthMachineServices,
      events: {} as AuthMachineEvents,
    },

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
          credentialEmail: () => undefined,
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
                  socialProviderRegisterUser: () => undefined,
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
                      error: (_, event) => event.data?.error || event.data?.message,
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
                  signWithPasskey: {
                    on: {
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',

                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },

                      BACK: {
                        target: '#authMachine.active.login.idle.error',
                        actions: 'clearContext',
                      },
                    },
                  },

                  authScreen: {
                    on: {
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',

                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },

                      SET_CONDITIONAL_UI_PASSKEY: {
                        target: '#authMachine.active.login.idle.localPasskeySign',
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

                  localPasskeySign: {
                    on: {
                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },

                      BACK: {
                        target: '#authMachine.active.login.idle.error',
                        actions: 'clearContext',
                      },
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                    },
                  },
                },
                initial: 'authScreen',

                on: {
                  LOGIN_WITH_WEB3CONNECTOR: '#authMachine.active.web3Connector',
                  GOOGLE_LOGIN: 'googleLogin',
                  ADVANCE_TO_PASSWORD: 'inputPassword',
                  SIGN_IN_WITH_PASSKEY: '#authMachine.active.login.idle.signWithPasskey',

                  SELECT_PASSWORD_METHOD: [
                    {
                      target: 'retrievingSalt',

                      actions: assign({
                        credentialEmail: (_, event) => event.payload?.email,
                        googleOtpCode: () => undefined,
                        googleUser: () => undefined,
                        registerUser: () => undefined,
                        socialProviderRegisterUser: () => undefined,
                        sessionId: () => undefined,
                        CCRPublicKey: () => undefined,
                        RCRPublicKey: () => undefined,
                      }),

                      cond: 'isPasswordAndPasskeyEnabled',
                    },
                    {
                      target: 'retrievingCredentialRCR',
                      cond: 'isPasskeyEnabled',
                    },
                    {
                      target: 'retrievingSalt',
                      actions: assign({
                        credentialEmail: (_, event) => event.payload?.email,
                        googleOtpCode: () => undefined,
                        googleUser: () => undefined,
                        registerUser: () => undefined,
                        socialProviderRegisterUser: () => undefined,
                        sessionId: () => undefined,
                        CCRPublicKey: () => undefined,
                        RCRPublicKey: () => undefined,
                        // mark that we came from method selection
                        saltFetchFromSelection: () => true,
                      }),
                    },
                  ],
                },

                exit: assign({
                  error: () => undefined,
                }),
              },

              loginMethodSelection: {
                on: {
                  SELECT_PASSWORD: [
                    {
                      target: 'inputPassword',
                      cond: 'hasSalt',
                    },
                    {
                      target: 'retrievingSalt',
                      actions: assign({
                        saltFetchFromSelection: () => true,
                      }),
                    },
                  ],

                  BACK: {
                    target: '#authMachine.active.login',
                    actions: assign({
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      socialProviderRegisterUser: () => undefined,
                      error: () => undefined,
                    }),
                  },
                },
              },

              retrievingSalt: {
                invoke: {
                  src: 'retrieveSalt',
                  onDone: [
                    {
                      target: '#authMachine.active.login.inputPassword',
                      actions: [
                        assign({
                          salt: (_context, event) => event.data?.salt,
                        }),
                        send((context) => ({
                          type: 'VERIFY_LOGIN',
                          // @ts-ignore
                          payload: context.pendingVerifyLogin,
                        })),
                        assign({
                          // @ts-ignore
                          pendingVerifyLogin: () => undefined,
                        }),
                      ],
                      // @ts-ignore
                      cond: (context) => !!context.pendingVerifyLogin,
                    },
                    {
                      target: '#authMachine.active.login.loginMethodSelection',
                      actions: assign({
                        salt: (_context, event) => event.data?.salt,
                        saltFetchFromSelection: () => undefined,
                      }),
                      cond: 'isPasswordAndPasskeyEnabled',
                    },
                    {
                      target: '#authMachine.active.login.inputPassword',
                      actions: assign({
                        salt: (_context, event) => event.data?.salt,
                      }),
                    },
                  ],
                  onError: [
                    {
                      target: '#authMachine.active.login.inputPassword',
                      cond: (context) => !!context.pendingVerifyLogin,
                      actions: assign((ctx, event) => {
                        const message = event.data?.message || event.data?.error || event.data;
                        if (message === 'EMAIL_NOT_ALLOWED') {
                          return {
                            error: { code: 'EMAIL_NOT_ALLOWED', message: 'EMAIL_NOT_ALLOWED' },
                          };
                        }
                        if (event.data?.type === 'EMAIL_DOMAIN_NOT_ALLOWED') {
                          return {
                            error: { code: event.data?.type, message: 'EMAIL_DOMAIN_NOT_ALLOWED' },
                          };
                        }
                        return {
                          error: {
                            code: event.data?.type,
                            message,
                            email:
                              ctx.credentialEmail ||
                              ctx.registerUser?.email ||
                              ctx.googleUser?.email ||
                              ctx.socialProviderRegisterUser?.email,
                            data: event.data,
                          },
                        };
                      }),
                    },
                    {
                      target: '#authMachine.active.login.idle',
                      cond: 'isPasswordAndPasskeyEnabled',
                      actions: assign((ctx, event) => {
                        const message = event.data?.message || event.data?.error || event.data;
                        if (message === 'EMAIL_NOT_ALLOWED') {
                          return {
                            error: { code: 'EMAIL_NOT_ALLOWED', message: 'EMAIL_NOT_ALLOWED' },
                          };
                        }
                        if (event.data?.type === 'EMAIL_DOMAIN_NOT_ALLOWED') {
                          return {
                            error: {
                              code: event.data?.type,
                              message: 'EMAIL_DOMAIN_NOT_ALLOWED',
                            },
                          };
                        }
                        return {
                          error: {
                            code: event.data?.type,
                            message,
                            email:
                              ctx.credentialEmail ||
                              ctx.registerUser?.email ||
                              ctx.googleUser?.email ||
                              ctx.socialProviderRegisterUser?.email,
                            data: event.data,
                          },
                        };
                      }),
                    },
                    {
                      target: '#authMachine.active.login.idle',
                      actions: assign((ctx, event) => {
                        const message = event.data?.message || event.data?.error || event.data;
                        if (message === 'EMAIL_NOT_ALLOWED') {
                          return {
                            error: { code: 'EMAIL_NOT_ALLOWED', message: 'EMAIL_NOT_ALLOWED' },
                          };
                        }
                        if (event.data?.type === 'EMAIL_DOMAIN_NOT_ALLOWED') {
                          return {
                            error: { code: event.data?.type, message: 'EMAIL_DOMAIN_NOT_ALLOWED' },
                          };
                        }
                        return {
                          error: {
                            code: event.data?.type,
                            message,
                            email:
                              ctx.credentialEmail ||
                              ctx.registerUser?.email ||
                              ctx.googleUser?.email ||
                              ctx.socialProviderRegisterUser?.email,
                            data: event.data,
                          },
                        };
                      }),
                    },
                  ],
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              inputPassword: {
                on: {
                  VERIFY_LOGIN: [
                    {
                      target: 'verifyingLogin',
                      cond: 'hasSalt',
                    },
                    {
                      target: 'retrievingSalt',
                      actions: assign({
                        // @ts-ignore
                        pendingVerifyLogin: (_, event) => event.payload,
                      }),
                    },
                  ],

                  BACK: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',

                      actions: assign({
                        googleUser: () => undefined,
                        registerUser: () => undefined,
                        socialProviderRegisterUser: () => undefined,
                        error: () => undefined,
                      }),

                      cond: 'isPasskeyEnabled',
                    },
                    'idle',
                  ],

                  COMPLETE_GOOGLE_SIGN_IN: 'verifyingGoogleLogin',
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
                    actions: assign((ctx, event) => ({
                      error:
                        event.data?.type === 'EMAIL_DOMAIN_NOT_ALLOWED'
                          ? { code: event.data?.type, message: 'EMAIL_DOMAIN_NOT_ALLOWED' }
                          : {
                              code: event.data?.type,
                              message: event.data?.error || event.data?.message,
                              email:
                                ctx.credentialEmail ||
                                ctx.registerUser?.email ||
                                ctx.googleUser?.email ||
                                ctx.socialProviderRegisterUser?.email,
                              data: event.data,
                            },
                    })),
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
                  socialProviderRegisterUser: () => undefined,
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
                      error: (_context, event) => event.data?.error || event.data?.message,
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
                      error: (_context, event) => event.data?.error || event.data?.message,
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
                    actions: assign((ctx, event) => ({
                      error:
                        event.data?.type === 'EMAIL_DOMAIN_NOT_ALLOWED'
                          ? { code: event.data?.type, message: 'EMAIL_DOMAIN_NOT_ALLOWED' }
                          : {
                              code: event.data?.type,
                              message: event.data?.error || event.data?.message,
                              email:
                                ctx.credentialEmail ||
                                ctx.registerUser?.email ||
                                ctx.googleUser?.email ||
                                ctx.socialProviderRegisterUser?.email,
                              data: event.data,
                            },
                    })),
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
                        error: (_context, event) => event.data?.error || event.data?.message,
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
                        socialProviderRegisterUser: (_, event) =>
                          event.data?.socialProviderRegisterUser,
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
                    actions: assign((ctx, event) => ({
                      error: {
                        code: event.data?.type,
                        message:
                          event.data?.type === 'EMAIL_DOMAIN_NOT_ALLOWED'
                            ? 'EMAIL_DOMAIN_NOT_ALLOWED'
                            : event.data?.message || event.data?.error || event.data,
                        email:
                          ctx.credentialEmail ||
                          ctx.registerUser?.email ||
                          ctx.googleUser?.email ||
                          ctx.socialProviderRegisterUser?.email,
                        data: event.data,
                      },
                    })),
                  },
                },

                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                  socialProviderRegisterUser: () => undefined,
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
                      RCRPublicKey: (_context, event) => event.data.requestChallengeResponse,
                      sessionId: (_, event) => event.data.sessionId,
                    }),
                  },
                  onError: {
                    target: 'idle',
                    actions: assign((ctx, event) => ({
                      error: {
                        code: event.data?.type,
                        message: event.data?.message || event.data?.error || event.data,
                        email:
                          ctx.registerUser?.email ||
                          ctx.credentialEmail ||
                          ctx.googleUser?.email ||
                          ctx.socialProviderRegisterUser?.email,
                        data: event.data,
                      },
                    })),
                  },
                },
              },

              signingCredentialRCR: {
                on: {
                  FINISH_PASSKEY_LOGIN:
                    '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                  BACK: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',
                      cond: 'isPasswordAndPasskeyEnabled',
                      actions: 'clearContext',
                    },
                    {
                      target: 'idle.authScreen',
                      actions: 'clearContext',
                    },
                  ],
                  PASSKEY_NOT_SUPPORTED: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',

                      actions: assign({
                        error: (_, event) => event.payload.error,
                      }),

                      cond: 'isPasswordAndPasskeyEnabled',
                    },
                    'idle',
                  ],
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
                          event.data?.error || event.data?.message || event.data,
                      }),
                      cond: (context) => !!context.credentialEmail,
                    },
                    {
                      target: '#authMachine.active.login.idle.authScreen',
                      actions: assign({
                        error: (_context, event) =>
                          event.data?.error || event.data?.message || event.data,
                      }),
                      cond: (context) => !context.credentialEmail,
                    },
                  ],
                },
              },
            },

            initial: 'idle',

            on: {
              SETUP_REGISTER_USER: {
                target: '.idle',
                actions: 'setupRegisterUser',
              },

              START_PASSKEY_LOGIN: '.retrievingCredentialRCR',
            },
            // Do not clear error on login state entry; preserve errors assigned by failing actions

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
                  ADVANCE_TO_PASSWORD: 'createPassword',
                  LOGIN_WITH_WEB3CONNECTOR: '#authMachine.active.web3Connector',

                  SETUP_REGISTER_USER: {
                    target: 'idle',
                    internal: true,
                    actions: 'setupRegisterUser',
                  },

                  GOOGLE_LOGIN: 'googleLogin',

                  SEND_REGISTRATION_EMAIL: {
                    target: 'sendingEmail',
                    actions: assign({
                      googleOtpCode: () => undefined,
                      googleUser: () => undefined,
                      registerUser: (_, event) => ({
                        email: event.payload?.email,
                        nickname: event.payload?.nickname,
                      }),
                      socialProviderRegisterUser: () => undefined,
                    }),
                  },
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
                    actions: assign((ctx, event) => ({
                      error: {
                        code: event.data?.type,
                        message: event.data?.message || event.data?.error || event.data,
                        email:
                          ctx.registerUser?.email ||
                          ctx.credentialEmail ||
                          ctx.googleUser?.email ||
                          ctx.socialProviderRegisterUser?.email,
                        data: event.data,
                      },
                    })),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              emailValidation: {
                on: {
                  VERIFY_EMAIL: {
                    target: 'verifyingEmail',
                    actions: assign({
                      registerUser: (_, event) => event.payload?.registerUser,
                    }),
                  },
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
                  onDone: [
                    {
                      target: 'registerMethodSelection',
                      cond: 'isPasswordAndPasskeyEnabled',
                    },
                    {
                      target: 'retrievingCCR',
                      cond: 'isPasskeyEnabled',
                    },
                    'createPassword',
                  ],
                  onError: {
                    target: 'emailValidation',
                    actions: assign((ctx, event) => ({
                      error:
                        event.data?.type === 'EMAIL_DOMAIN_NOT_ALLOWED'
                          ? { code: event.data?.type, message: 'EMAIL_DOMAIN_NOT_ALLOWED' }
                          : {
                              code: event.data?.type,
                              message: event.data?.error || event.data?.message,
                              email:
                                ctx.registerUser?.email ||
                                ctx.credentialEmail ||
                                ctx.googleUser?.email ||
                                ctx.socialProviderRegisterUser?.email,
                              data: event.data,
                            },
                    })),
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
                      socialProviderRegisterUser: () => undefined,
                      error: () => undefined,
                    }),
                  },
                  BACK: {
                    target: '#authMachine.active.login',
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
                      error: (_context, event) => event.data?.error || event.data?.message,
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
                  socialProviderRegisterUser: () => undefined,
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
                  socialProviderRegisterUser: () => undefined,
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
                    actions: assign((ctx, event) => ({
                      error:
                        event.data?.type === 'EMAIL_DOMAIN_NOT_ALLOWED'
                          ? { code: event.data?.type, message: 'EMAIL_DOMAIN_NOT_ALLOWED' }
                          : {
                              code: event.data?.type,
                              message: event.data?.error || event.data?.message || event.data,
                              email:
                                ctx.registerUser?.email ||
                                ctx.credentialEmail ||
                                ctx.googleUser?.email ||
                                ctx.socialProviderRegisterUser?.email,
                              data: event.data,
                            },
                    })),
                  },
                },
              },

              localCCRSign: {
                on: {
                  FINISH_PASSKEY_REGISTER: '#authMachine.active.register.sendingPublicCredential',
                  PASSKEY_NOT_SUPPORTED: [
                    {
                      target: '#authMachine.active.register.registerMethodSelection',

                      actions: assign({
                        error: (_, event) => event.payload.error,
                      }),

                      cond: 'isPasswordAndPasskeyEnabled',
                    },
                    'idle',
                  ],
                  BACK: {
                    target: '#authMachine.active.register.registerMethodSelection',
                    actions: 'clearContext',
                  },
                },
              },

              localRCRSign: {
                on: {
                  FINISH_PASSKEY_AUTH: '#authMachine.active.register.sendingAuthPublicCredential',
                  BACK_TO_IDLE: '#authMachine.active.register.idle',
                  USER_CREATE_ACCOUNT_BUT_NOT_LOGIN: 'passkeyCreatedButNotAuthenticated',
                },
              },

              waitingForRCR: {
                on: {
                  START_PASSKEY_LOGIN: '#authMachine.active.register.retrievingRCR',
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
                    target: '#authMachine.active.register.registerMethodSelection',
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
                      socialProviderRegisterUser: () => undefined,
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
                      RCRPublicKey: (_context, event) => event.data.requestChallengeResponse,
                      sessionId: (_, event) => event.data.sessionId,
                    }),
                  },
                  onError: {
                    target: 'registerMethodSelection',
                    actions: assign((ctx, event) => ({
                      error: {
                        code: event.data?.type,
                        message: event.data?.error || event.data?.message || event.data,
                        email:
                          ctx.registerUser?.email ||
                          ctx.credentialEmail ||
                          ctx.googleUser?.email ||
                          ctx.socialProviderRegisterUser?.email,
                        data: event.data,
                      },
                    })),
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
                    target: '#authMachine.active.register.registerMethodSelection',
                    actions: assign((ctx, event) => ({
                      error: {
                        code: event.data?.type,
                        message: event.data?.error || event.data?.message || event.data,
                        email:
                          ctx.registerUser?.email ||
                          ctx.credentialEmail ||
                          ctx.googleUser?.email ||
                          ctx.socialProviderRegisterUser?.email,
                        data: event.data,
                      },
                    })),
                  },
                },
              },

              passkeyCreatedButNotAuthenticated: {
                on: {
                  BACK_TO_IDLE: 'idle',
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
                      error: (_context, event) => event.data?.error || event.data?.message,
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
                      error: (_context, event) => event.data?.error || event.data?.message,
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
          SIGN_UP: [
            {
              target: '.register',
              cond: 'requireEmailVerification',
            },
            {
              target: '.register.retrievingCCR',
              cond: 'isPasskeyEnabled',
            },
          ],
          LOGIN: '.login',
          FORGOT_PASSWORD: '.forgotPassword',
        },
      },

      history: {
        type: 'history',
      },
    },

    initial: 'inactive',

    on: {
      RESET_CONTEXT: {
        target: '.history',
        actions: 'clearContext',
      },
      SET_ERROR: {
        actions: assign({
          error: (_ctx, event) =>
            event.info || (event.error ? { code: event.error, message: event.error } : undefined),
        }),
      },
      CLEAR_ERROR: {
        actions: assign({
          error: () => undefined,
        }),
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
      hasSalt: (context) => !!context.salt,
      hasHardware2FA: (context, event) => {
        const { data } = event;
        const HARDWARE = 1;
        // @ts-ignore
        if (data?.active2fa)
          // @ts-ignore
          return data?.active2fa?.find((item: any) => item?.twoFaTypeId === HARDWARE);
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
          return data?.active2fa?.find((item: any) => item?.twoFaTypeId === SOFTWARE);
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
      // clearError action removed; we now clear errors inline in each BACK transition
      clearContext: assign(() => ({
        ...initialContext,
      })),
    },
  },
);

let stateDefinition;

// @ts-ignore
if (typeof window !== 'undefined') {
  const authState = localStorage.getItem('authState');
  if (authState) {
    const parsed = JSON.parse(authState);
    // Drop persisted error on hydration
    if (parsed?.context) {
      parsed.context.error = undefined;
    }
    stateDefinition = parsed;
  }
}

let resolvedState: any;
if (stateDefinition) {
  const previousState = State.create(stateDefinition);

  // @ts-ignore
  resolvedState = authMachine.resolveState(previousState);
}

export const authService = (services: {}, context: AuthMachineContext) => {
  const mergedContext = {
    ...authMachine.context,
    ...initialContext,
    ...context,
  };

  // If persisted authProviderConfigs differ from provided configs, start fresh (ignore persisted state)
  const persistedConfig = resolvedState?.context?.authProviderConfigs;
  const incomingConfig = mergedContext.authProviderConfigs;
  const configsDiffer =
    JSON.stringify(persistedConfig || {}) !== JSON.stringify(incomingConfig || {});

  const startArg = configsDiffer ? undefined : resolvedState;

  return interpret(
    authMachine.withConfig(
      {
        services,
        guards: {
          // @ts-ignore
          isNewUser: (_, event) => !!event.data.isNewUser,
          forgeClaim: (_, event) => !!event.forgeId,
          hasSalt: (ctx) => !!ctx.salt,
          hasHardware2FA: (ctx, event) => {
            const { data } = event;
            const HARDWARE = 1;
            // @ts-ignore
            if (data?.active2fa)
              // @ts-ignore
              return data?.active2fa?.find((item: any) => item?.twoFaTypeId === HARDWARE);
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
              return data?.active2fa?.find((item: any) => item?.twoFaTypeId === SOFTWARE);
            return false;
          },
          isPasskeyEnabled: (ctx, _) => !!ctx.authProviderConfigs?.enablePasskeys,
          isPasswordEnabled: (ctx, _) => !!ctx.authProviderConfigs?.enablePasswords,
          isPasswordAndPasskeyEnabled: (ctx, _) =>
            !!ctx.authProviderConfigs?.enablePasswords && !!ctx.authProviderConfigs?.enablePasskeys,
          requireEmailVerification: (ctx, _) => {
            return !!ctx.authProviderConfigs?.requireEmailVerification;
          },

          requireUsername: (ctx, _) => {
            return !!ctx.authProviderConfigs?.requireUsername;
          },
        },
        actions: {
          updateAccessToken: assign({
            sessionUser: (ctx, event) => ({
              ...ctx.sessionUser!,
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
          // clearError action removed; errors are cleared inline on BACK transitions
          clearContext: assign(() => ({
            ...initialContext,
          })),
        },
      },
      mergedContext,
    ),
  )
    .onTransition((state) => {
      const shouldUpdate =
        state.changed &&
        (state.matches('inactive') ||
          state.matches('active.login.idle') ||
          state.matches('active.register.userCreated') ||
          state.matches('active.login.successfulLogin') ||
          state.matches('active.web3Connector.emailConfirmed') ||
          state.matches('active.forgotPassword.passwordSaved'));

      if (shouldUpdate && typeof window !== 'undefined') {
        localStorage.setItem('authState', JSON.stringify(state));
      }
    })
    .start(startArg);
};
