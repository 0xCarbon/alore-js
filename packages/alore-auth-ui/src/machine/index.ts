// @ts-nocheck
/* eslint-disable no-unused-vars */
import { assign, createMachine, interpret, State } from 'xstate';

import { AuthMachineContext, AuthMachineEvents, AuthMachineServices } from './types';

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
    /** #no-spell-check @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBmAIwCAdAHYATHoCcANnUAOUwBYLevQBoQATzUGDmzTuMWB603oWBuohpgC+YU5oWLgEJGA6JPiyAG7kAJLs6fTpAIIAMukAWlSCIkggktKy8ooqCBrW1jrq1vaaBkECVqaaAKxOrg2adhY6pgJtHkZWbeoRURg4+ESkicTJhGlkmdl5hSV8muXiUjJyChX1qpp6pjqavbfGBn161sYvji5qI5M6QXsfQMAhefjsCxA0WWcTWm221Do-GEiiq51qV0Q2jGI0+QWmrT6AlMgzcAk8LWsrWM5NMPjakOhsVWCXh5Bo6QA4uxGABVAAKZVRZxql1A9QMVOM+iammswVMNgC3yGqncHW8NJpfWMJnUr0ZS2Z8R0bLIHO5fMFx2F1QudUQkvU0ve1jlCqV9lJDWmfQegVaHwsWluhpiKxNZvyrE5mSFFTRoodCHcFj9-RMwPspgM5gs3rV2l01gE3V1bxeboMYZhLNNeFS5AAYqwKJzWEx+bkaDQAOqtgAi8dOdox4sdAj6YzsRJMk0+NmsBc0xj692MthCmnUdwstj6NeNcIbWwSAHcwAAjdTMeSkBsSABOOjwd7AJ+IUDIbHYTfSFGwRheyoAAhdRGGjWN2GHSoRXtTEEEeOwHgMHwvlzHd5W9dw1x0PprGBKwp1GatIihI0I2PRsdAva9b2Ie90CfHQwAAW2QQgABt0mIMQMDIAA1KgKHSJsAE1GCobBcnSfJJMKWMQNk7IxJgxN4PHRDTCCFC0KMDD3gMbCQTGfDCNMYjAlIxZw1hVkTzSGirxvN8H2fNJH0IAAzZwSCgKh2K4qhOMIKBCEvLiZGcMgIHkBISBSCQAGtWQouz62o2iXIY98mPcsBPJ8vyAo4zjgtC8LIvQZwEASiQ8GQUUyjUuCx2ULETGldRyTuewDKwn4U38PQdEmczLKCQ9KPszLnPoxjmI87zfM-EqgpCsKIpC6qyAKx9mLETjGq8p9WNNNK6zZJy6NcvKdCWorVsCsqNsq7aarqhqmuEFrRzFdrEM6loeuVfqjMGyVczwgjOgsiwSKm9Krqy+bcuYtjSoMLzkFvCByCEkTxJYfIZMA38mCkmS5IMJtcl+9F-vqW5-kVTx5UMcxDOw2x7jG2GJus8jbMuhzzzm27FoK5a-OYI7CFY9gvPQNbOKx5AYri9ZEpS87hcjUXruyhb8sKlaoFljiFaVlW1dq4hEq+i5mpRBNWsZrELEecYCL6W4Ocw8GhleWxofG+GrMRkXZpunK3PuqXHvNuWreV561d2x99ufQ7jtO3Xa316OjbRk3pc-C35cV1PMexu2Hcap2fpdkcGeTEYvZsPpfb6zmBqDiYxj5ojw8msimWmjLT0N1G48ICBOPZKh8ioZgmB-dgV-oVt6aTBC5Q1N0LBedRfd8SxsO6rxUKnARc3lGx5jHi7C6nziJDC4hzQYAVGGoWMaC4BQPkdAKA7w0gDEsbQ8Kggss8E+HQSSDXlH6EE7g8SeEnBZA8T89ZUVfu-Eg5p6C5AoJ2bsNAADSVAJKQTjM3WCf1kzOlePoNc+ozABjsEuQatwLL6D0F3N0jxnQjEji-Ryb8P6JHnuQWhPJezZAABJAVAjeDgG9V7b3oepNqTMqReHeDqTwPh3gjHzDwncuhVyLiPsgkI1gxF4IkQQ4g0iF5kHbDGZeEEYx0JOAw1uCF2bpjdNYXoa53CBG9LqAwOhgjGE8H0fUeh-CtEcTNfBUi57uNyAOASuR2DMCoIwLejAuw9n7BQIc2i3bJiaCwgI7dgy6kCOYoY2l1AtBCJ8Vc8oCKhhwQXJxCRJEkDceyLkPJMhASUWU8hVDVI1MYQhIwegvC2BLAI4EjxtLehGHw7S3QiQ0hBBs9Jk9nFZJkV-Zeq85kVMHIwbADBFGsGqf4nR7sUyGBdPhSUt9SzkgIns4IzQBGPHlPqI+wJwiDKPBky5YzsmL1uWQh5VSnkvLeUcD5tSEJaElOMCYJgOi2BBOoPZoS8IpPsLqJU25zlXVGa45FNzN73L7I8559BXlDgMLi5Zml9TyjwrqUsntDJym4UMfozoARWBCJYX2U5BbjyRgbZl4ydBvwapxfkyBYCwBSs4GgoVP5-iyDQZR5TKHUJ8VBMBujECWH8N7cwpZupWD3NhN4sTOj4mOQINZehGUapcVqnVyA9UGqNWAE1ZqyAgVyMwChjqvmtCMOMfwBELLmG0MYClEMqTNCCF3E+ayj5H1DdRTVyLtX1Sjfqw1xrTVQE-jahZjB2AdkYDQAU-JWxcHebaQJQq3S6CPo8HppYEkCOwoEXQcNTHaSaJA6tmSkUyJ0NINtvYZCYCbbG6KFr0hWo5Z2uRaamFJPuJDT25JnRvCaNhbozR-A5h1JYEs2CbJDIRSM8Ndad3ED3VgQ9xrE3JtTUs0dANOgirlL4FJVJDDnwhq+h4NhdQdDpWkuFE8mWAa3cB0DB6Y0QY7Xa7tTA+38gHaQqgw7XaCrg8CTpCSXhvGIq8AYENJRXz0KCPcZjiSTnXYillW7oQ0DwI+MAYBP5IhYBwAcewOAFD5Okc91Cr34tBM0DoqFupUlvp0FUjosMtDWfUzouI0ziYA1che+cZNyYU2QE9Z7KM0N8dBGDu8hVjQBB8CY2h3iGUQUHN0I1i1-DsB4I+qrn7DPrU51KWBXPyfbfMqjPbaP0aHbpzS197grjuLiAiupgzzt8OMKcAQzDWKDQ51Lm7nN7SfB53YXmcs+Ydf58B9QtyxMwdpWl8NyTYW0H6SwG5u7+G6HKFrtat0dcfGQbzXa8v9sHYxorrHgjeBXK8AR8MeMXypC0P5NIT50iCI-X98KLmObGcy7AYAsASAgDQMAC8TzyDZXcm1lSmMtwCxAgRI3PYEXnDOyLWJFSxK7mzbS8NFTOmW+Gt7H3MBfZ+390UkGU37fqG0KBeYUnqjTC8PZZb+FygzVZDcIb8PqpreGuT6BPJgBSH5GgUb0AazWHVHWaqo4btcZz7nvPPz884ugOuDbvpCBJ4gNoXcATAlCZ7VCxg9mTi8Fh+pQQC3B0x1IqXhAed84FxnLOOgc7oBOo+M6YvxEvclx96XNv5eK8dvIZ2ArYOk-6OmQItx7GKlLLxoYhgDM6h8P0RL2lzdIt4hgQ9Z4nwQCJ9BoP4PScn2aK8EeYSTfejTJ01mtw1wnOQanll6f0CZ+z7nnFI6C9q5C9S-o2gOmWHMwgZnXTL4hGJIY2Fj2CNhqyU3lvj4c9sGwPyZeXBGCeM5N4i0Uy-P58G2rxUzQcylg6bKkYezCR4TpB0W4R8xUPaFn+57rXG98WbzGrPC-BLCVEn1vxHf98EAPhDBvYmhgRcwONC0hg7BeYqR4YkktAuhNAG945TY-J8gXEhd4p7Zkp0sn9CMpEHozYMCP4-cG4A8m498nUEA1w-BRpUxnRAh8IQgY9EBfBmhb45RtQIDPYH83cUtNUiD0DMDYphccDRdkt-0X9UCy4oASCSAyDld29mNg9EAu4fBvBugx8-Bgg2k2CNCUkC0Ulb5DEqQUChDPx5DP5RDsDtY8CnsCCxkLC5CXFFDG4Vd+UADqD1CxgaRgxuodC0MZUPUARyQ7BuojACIzDWdxcJMZDE4rCsCtZcD84HCZ8nCE5iDXDPpyDiBmp1AqCvk1wKQ8wklyVeg+4sRmZ9BRN3BupDBeDzDMjhCP47cDojonc85+CpDBDmjLDsicD-c8jKCvCvkc1mg8QSxJgRgpwoC1DtJNQjBSw1lb5-BjAUDYBUA8A8A4BYAvJUBOJEjqAmxERlFk0ikewSlWAqFd9Ri25b4Sx5UT5fBiQkl8JvQUkxgAgPhkEeYQsNiJAlYzxkA5N04fw-wAJe1exlMBxSgBtqDfBeg8JtxDCzNb8PjPYdAmhBMn0dw6QLIASgSQSwB05eQ6BGBFESEBxewSFikaY6Z4Svk7gNwAQYk1lFx6tvQuM4lESSxtxb8OhCT0BgTQTsY29GTkwbB+gWgcw9xgw4Z9QPiwkHhy00xehuhPZJ9H80j2dCC+ioA1ZcZyAbDkiJDcEejw1nDDSvswA3CKCVcJSEI7AQD3QNlekIUlT1kM1LAPBtxoip82cJd4izZrS8YkiRd7Dp9dSMi0DPxQzbScilCbQVDO8h9yRdBOpphv1KiEATARoBF-BZVYZJg+DJDn9ejYyDTsYjS2js4OjndXcyzHDXErTqybS7ThiHTCjkxETSt25txtIXgPAK8dQsStdmYSyQQf1tSoygzMAQSIARSSSxSyTikaBWAmx6AaTqBGB6TVdcz8TRokk-i1xZxvRBzNQC0SxVxu4LAUD5yF8lz04CZf8KToTcheQeV9zeTRodlyi0wj5vQdw-QJgy0PhQRQQQQtTujyzw0HzFziT04k1idHTNIu5zBRUjAJhj4pxpVnV4ZoF-B8IC0XUCSYj3dpDSAzwBxrcdjvwOAITAJYSBJ0gikYS4TuyEINwvZQQNwAjNS5ih9Lt2Z9RLBtxgK7zyKBDw0qKaLec6LEQqB2ABx2LvyzBOlgLBNghsQ9DEJILRp4YdwtAPgNxmspKLS9TKyayTSIzUjZy4jnCjSOzA87iuLPgvATdVxnRoccyhy4lQQUkpwu5PYpwmirKbTayHd6yuimz0iWz9SnLEz3D9zmdOlw87h2E6RUJ9d9QHg8QNxYFTCUC5NYAFMIAZZ5AvJCAXdciVZwzxDIzAy4iSqyqKriAqqarRQVZnKRiUzAD4ZlSqQtBiINxUw9kpUAQVxegM1gwxNzLYKpEMYuJ05FLlLVLUKAZTtpRo9Jxa9nj4dEIpR5VQR95kk3QUClrVYxSXyiZKZZJdzaZ9ymC-Qg1b5gQEk2grAQVPh9A79JQF1yR+gLq04xTkK89XLNJzAzAsTiRbAIVRrWDEJuoupQs1kRgQwWcAzYiPdgzioQb1YbKGq7KmqcbnCbZa4kr7Tvy6QRpPhAVMJjlB9twGkb86QIK9wAgwrZDyb1Y1sorc4XdibsbpCyb8aequyIbNq0wRoj57AtBLAuE8LEJqjBMJg6ig1bNSzzSFqxkWriByqnpSprLNZbKYLmydA9aDb-JnpErBjciXK+rqDsxdBHg-YfA74aceFD46sqQ7tByV0ubE5FEzxcglh6q7ChaKKKzZDg7Q6sBxaUqVwQLcxggklQ93AgLoapS9x6ttJVlA6zZY6w7CaI6za4rcbPwi747KbOzlCwdAC6Uxgdw7gQRljV1M77hs6CIehARMaZySaRb9Sq7MBIrHcGzI7pLLKY6Q6lgE6Nr6h2CUFNwn0JgSxBKPgvBgR0yiLmbPYUCvIPtYQoAmwnwYABxGoCaTaiay7ozXED70Aj6T7Hwz6L657OKhUAxfrPhLFD9YYPiQgYbwLv1Aq3h97D7Vhj7T6wBz70BebM52iBbGztbzb77H6oGYHkA37Jahs+KARegBFpjcw51BopTQicTug2bSxkD5rzbnDOQJB34F5EiS6Uib6gy6GGGoAmGBj64lD575iVwHgOgBEhy1x3hKU1lvY5QjFPAdxcwC6-J6HGGwBEi+ax6YrkHy6OHlGrCsHHaxi3hB417Ft6QvqvaiR9BbgeMFwj4tb8Dy6oBOHuHWiWGzT7Hb6dBHGdGeGldkr+GaC-TxhgxSV309QL9LsiGEkT4n1fUUCvGuGVGRCr7S7YqPH4nnGFCa7mpkz67vDFUukdQGjQQgisRJRpRT5PAUTd7qGsao7w10nEnWi1HorBa2G4iGndGsnercmxj7s4lfZX15tHgQViR9AxL3AbAgQkliqvcrcZdzY5M8ZiBZAo0KBmAKBw7WHUmgzLdrdy5FmFMVnOI1mKA9Gem6knhRpj9Vag0yU9k9wrEZjDA2ZEMZmuc5mZYDnlnCBVn1nR6WmkH3GdnZm9mFnIBDmfnjn1mzmAlUywkKRKc06RGcM9lBNOkg1kdPh9IsKNizVPnwXvnfmNnPNrVet7V-99G6kObRoFtnRzAcx+gX0KROhSx+klVSVcW218WlmjmTnxT36AZ3rmgmhMFUJsQEl7mcwVTCmSxocQg+62mcbgNuWIWiW28cnYXACb0PL4NJx-Aj5b49kzAwVOhonHg5agaaHy7lX9mCXeW-nNtqNe0dsGNQdNXvDJg-UTAQQvKcwczmZN6K1AhFQo8McrWPHnCKAwAwpYB0ACp+RUBLwQo8AKE41mAvmjnNm3GdT2H9So2Y243HwE2k3CAU202M3IWYXPkqWkS+ps13g6QtBjINQiQByRGKxHgFHPx83CBY343E3k3U3nB027XIWs3Grhbo7E4e2+2i2B3S2h2R2eXK2umVcNXq2gkElYkcNIVpblVjIdI9RS12XXg7Gc2HK83o3e3C3i3B3y3R2o1x2J6LKYzZCZ2b352y3h2K2o0E7PDKXN2FjYbnhnmdxdLU77gvVXQg0C0u2oB33+2S2v2l3VXOIn3FXB7KyEO52kPF2f3OIE6CjsG1CYOs03QnhdQwlBLIYvBljWZiRDKktNGI3L2C3EO73v2H20PmnEHn2db4qsOr3Z3b2F373l3f3V39zQl7h+ltIiQkk9WX1uh+m-T+Ttw-Az37LSbWPr32PRPOPxPuP4G6zeOMOp2zZsORPkP8OE7128UhUvVNcQ2TAabPaZV-CsTmS4CTqOhNOB65M2PnxWUrVWBoTAFsAaAnk3kCh9yiRDselkcdxpHB81Q3r+nFQVUrBiQU9w2p4AvdOgvrk6A1q-5T16AKBcgcgOBJJpJZIpOghfCKiixBEwDlxiK4lWhBzJhPiWt8vZ3xkyBcl8lClilSlgdBxYv3AMzmYrBUJw9Eabhup2NvX+hcxEt8JeuhPC2Bu5EZkeUVEwJ15N4tEBWmZfAxhnnghAUaQQtadcIYENPJwpQu5NvAuBukQf5SuAFhJgFhJ6u5V94YO1ieoFuVwtBxh7AnveErBLXamUs+vtvWUN9vFL1-HT40rAhDBdwFPQebssS9wBEsFg53hXuCudBC3WJYBsAvtH3mBoxyTwvIvsBov8gpPPgRp8Jgw2hZVyQ9dBobgzA-RTGCIIighObcvHIEeCpt1WrDauJ0PtnJetvpfSr9a8bSoq37PBXwssSRFc0c1GX+e5RSxRp5QpynQcJSf+vVera6qePOjWnFeEgpfnwbf1euJNeWNSc06UJkMaVcRQe1lpQ79LFossfJK4epCXeWJnoBIo055cjv9CYJI7rWf-HV631TF6Rbhz8jeQ3-RgwU6dQQsI-+7hbo-Lq4+QoIBE+wbJuXgYbrFgxfUAg2uMK0wQRPAcIC0IQJfnflfnxK-4+a-CdVqVK2BYTYu7BF14Zbh1dcwVxlwUkZO0wgrAh1KrftvRbSoFfmO8uB+K7raNfJP0+1wxg5vcLl-Zhlxm+ZQfBARfUPBN-pft-5fXGJ2KLo-X+CPJO7OvfEBD8fofRF3DXBugFay4GkCNGdCfBMW+yWwM-1LiJw6q7-PjldC-76luqknf9ucwQgBAkSVgNZF3G65hIDqAvPcJhm4rXwc0JgBAYfzt7Gd+aDvQFue375vdv+nvVQggA-QTEekhhWxGuDa4UhXq2gH4jfFAZ98LaB-WTGAEahgB58i+VgMvlXzFIvu5XSrukA4BPVbMmuR4CZGIpuhlw+fcjm8ECr38GUEg6PtINkHyDc8VxRgOkAHDLwnqoIdMGWEMyeBDKBYDwMCDHJphosSSeGLQKsFxsbBdfdPqhF0CYQXOeIMRkv3IEeAo8ZaeVsECCESBWIh0D7H5HfaPhE+KAjDpYLSEZDZA3bLbjkNFAcDUynCbwJ3CQx0gNwfPVUDsgmKPBa8q4XcFoFSHpCF4xQ+DqUMT729x6+QqQYUO6FZC+h5Qk-qd0QCnYRovQAtF8ASR+kb+IcCAiuAXAZUHEFgg-qgFKqPgR2sgnPMcVOKMBzitASLlvBuLfkRgswulHFyyr+Ab+LbEwMJlhqnZaBltMYQWzKEXBkByTLZnvyV5vcPhJQr4bVWegVCtWZ-LEknR2RBBbghg3UP6BZYPFzA7gTYZH2fzR8OmSTMQikwBGsCye2I0gpMOI5cDb45-XgkYG6hQ0UuZidjPJySQkpTMTHIFoCMJFONGmhCPIU70kFvciRmTO2kmSmFkjuoR5bnq0BnBmAIBdwAyv9VXAX9ugtA-kZ-AGEaNWRBI-rsqIhHeEzMLQXUNmkIjEhA4vwPwaKm2SmJVuc1DEWgIP67N5mzAP5tyPxG8iyedomWNCxJEAdIaXlPCK0FepR5gmBYY-JoR4z3xJw9gd4SC3tF-NVRjvZ0dHzdHlwPRgovxsKO0hyhvAvteoT6x1AFh2ecSHjJTheAwD1iWwt7pGk4gOiKArac1N1lJY9hO0qgv7v42RqdJzunUdnnARS6tA2xmERrLOD6R+dy+B-CsVWJrEbYyWTrfLLtjdYbtAsBaUInYB6SUcB8BYI6gImixioqQbxWgaOPWbjiwhwo1sYuI7Eri7AXgnSA8QXCrhbmToXcQ2ihbViE0JLbTBJA-JfkWx36GlsWNhptAsEXggiHElJQmIYEhkdEWX0-4jiHxJzA8VBjsEOCnBLY4pieOXHvBVxRvKcHqJ6R0gBxd4ssWTwrEwSE0jrbbHRhnH7ljx7Y1CV2LzH3Apw7wfsbeP9IQT4eB-YEucE-BP0+WACEhGiltR-5biXogGMjQEyykICbwZ0NhHKYJY9QK6UASyJYEujresvKAFZxQ6Es0OTo9UUpO25u9Pwakmzp6JwGaQZhLQHOn6OVAFoCwaOTzt+nCQ01gQtAvSapM-bqTM2sY5gVpx0kq8VJBkrjtqK+R1COCIQHXJ9X9QFhTseEWbqhmQyjxrRBsBMQP3eyfZvsv2XKBcEBx8SQc+5OTiNjCQPpJggIQwQIm8BgUsEsCKtPhP64u9kpuOVKQTgyk8TSEr43+FQH-iAIcp5gIAX4Hcr1DTsy4KFJSA1LzCXgZ8SMYF1ql440p-2T+IeNJETBcq6FZpHCNrwDSoYgmYkI8CEwmDIx7zUFnyy0mKTEpe0+ZicwCnJhg2ExXwAgQ+AmQIpl2SUdqCnCmUFJXk46d7m7YxiGB6jOMdpPekfNPppzIye6yZKhZKQYgyUHnUEqqAjqwYBiThKYlDjIJb3ZyXHQPSuT8Ou-P6Qf1RlLA-Jhnc6U6RmIPBkcwYB5kH1B5rE8Iho50C4IfhOSVJaM-Gah3+amceR0fXGWBgxn+TgZc4gGJ7DTAAh9IxYzZFSGXCbSgJveYNoJiCDgSMOzuRxu-kNSf4IA73JSuPzeQcVSR1mTQh0AGoBBoUmgLwb5yEZg9fY2gUlAqx5EKyJASs2ACrIG6KUspE3NHo8QIh3ABmrtE-NKN0D1YNOaODwHLOtmn1bZ8gmXmr3LgRVDpXkm2XbIdnOTbavDVMaSOEbbt8pq4OwEnV0qFhDsqCIRF8DxItZY5YchORFQ8moCDYxcj-NnnDlW1E5vjKmv4xCpYlUcBsk+EYSVqpdRyERfcNTm+LQVg5z9UOdXIXw6AqKNg8Ev+EAjjcqkT1QIDySDQnw74d8bOTMU3o6g7sIHc7kXJDlxya5sAZAPMxsHRyB6Vc5WfvMPl+R5BhMzSOpy6jRMtkIiAlDf0wnWMLIbQLUE0B3lDy95o8g+UfJHk55y58s3eSXMvn6TAFN8qWuxjFYGt5OoFJfg32pFTl6sCSbBGRGIA2l4AFQboqSI0BIK2gayToCZFZgLdIZV8JLhKnnD155qSQUWHgrFZjMDcc3OYa3357koXqVgMwIknJS6gHMpI1dGOQ9kWz1SxILwUZSOz6JSwrwYRAPOdEowJYj4FOdmmhGJZ4EZ8cDi4M1AfyECXqGpixKkIKLY4d0V8MYr8gpyReQje+D3ADjcwTeZkfmCPFekD0jFxsGPqVB4hv4LFSSKxUQ39hcwIYbxU3mHARgSDXFJcOgc9HKibQqoQwYyQDGkadI2YfisGNhEVDlMYYw8UJfFKLgzw7ol1eMt4qSXuhQYvcY0SmDTC0dMlcMbJQYufzhK44jlZOFXB5pFLfFpS2xRDB8B+gHFWSiOGEvFjGL0YNtSqtVVYiQA2lySjpQEqGBaAAgwSxxbUow4NK7oyKbxdKHZ7EC9QGtKbMGBaC35y0PYihg3lJGQxaax2LjGdi7hTZN6SdQiMZQXAoE1lQkiUOriOycZTspaRGhHk3pko-BBaWcPorM5EZnMFY8DHGhrGkjCQHldMRvK565iIYlmHQt619ibIgVPIlbM5hIz7pwVcSkGcmFWTbsTq4IBaVmCNYN9W6RYb1p3yeVSYlgmWBTKcvxA1FEMtgQwL7AOoe0aWxmGwKhGn5BznRmKhIGtiZWijfUz0h5j0CVoTMq8SSF4I23BDTlgVUibHClPxzpS2ofM0nDhDHKNJ9Eg5JmjDGqFWRjyZkRURIM1SJioAcudAAIpgGjRXigiOTlZJ4QmEzJNIdHMzm1BPK58gCgRWjVFRhJOgcKw3tARlGTASwqYDacIzg5WFSRMKP0PYERKzgyZrwCvI8RMB8lxiPgGwBsS2I7FDU+xQ4i4hTmrFymFaIwuYG-Qjl8yJZdTpuDF5Ckny2MUkV0HuCCZkEEzPwCYFpyCZPOGcyHtIt9hwdClLytguBR5J7gB8PxT2B8Q8BjklU6hBnHIu0map4Kza5ANrJ+S-V1+UqZpIjWArjAnuhfMIkSFL7KqxkslWimAFbXwEHgMPcwIgTJn64g0oqMfH3j8DaAkZk9V9onCNKkjsM0oEXuoqIYhBokgjSrCkkJBo4zKOS4FqXPapjKwRpUADRrTqygCGs9EpWokiAH6hmCvQUFKCGBo1xN1Y6g8pOBpZY9wstBBoViDmW6rfa4BHMHwotWWkMB+NVtRASPJsZi+iw8pep0XSGYi8+ETwHcBmbOSVY-6sjYZDSo51bA0tVlr2pNa7UtpPhc9RirY2Vlh6rasJMXjOxipMewIICpI2zpcZiQO4UsXBriKoMIGT9F+rAyhXBMpG-SbcPhG6Bcl4uBczqFwnU2CrNNshJRgkzjVkayUt6EKl6rqHEMZUYAo9Ynh9JzcCIcTDkcFviX1A066YHMEH2PwJILI41R4msMjWvANw7BN5h9LBaGcTmAijNHVg1rdJyQwQVFhY0YLPN+gFkOWpy2IAqsNJlWsja21gLOlsQZ-WjYhBh76AYk46YRAzjg6WdP2eHLjgIpXDFgaalgB4oDSmwWNmYT0r9GYBQJUUAABLG1kF7bNAktJiGIARx0hqZ6OBiX3jFkgAF4SsNQhKjwidAry8oD1IWkvC2ymIrEDqLcCu29wEksNQtJ5CgCYBbVNBIwi9tsb1IPtTgM8HPCwClMBATgTAGAFCjg61c5iNLc9sIhvbW6YGnhOkoB19jbt36qPgP1OXes6s2YNMDoR8BeDYYoqBnPCq-QrqjpB-Z5alpI5vB+EiWTNcv0QXTgl5nsD1XCNoEU8qeNPTiPGumKm9Jw0xcFM+nYXiUiUXlW+HnUqlWaNRuklSSrAEVBL+gUwF4GFneIYTBZyGX+oqn1a0Ch+1fXIvGpgK6qFQzwsnKD0mb8IG20eXMGEVoHf95pn1bwOvzi5vBWYS-W+JNTmG2ItAQaXzdjLe7BC5Bfq6Tbc2gSLzJws6N4IYMVDQjc0hyCUSkKqnbdXwXQzISCOvbfDNVWveoAIhSS69ywCBTqO7pz3GCq1W4KsLQJ2EFR9hcbCAJxoj09Jom7gbKnnwWIisdCRIKFLfEjHOTshyGriPGrKb8JbAY0QwN0HKU3A7gxeDcPUlRGvarZ8Yg-sqPjXMEDKU6uGHZIgHKcbxwIQRGess11KbRQIqMe6IoDzTYEo0MwJWjN6IEgxh2GvPSEVAw9nFw48sQ+LHFmomVjxNrdj3p3ZyexAIPsQjLAnk7MRUE3VERLbRQHF0JguTnAa8GghKQJKeTbLR5i0D2JPQries2wM07YD7CbOe8E1z+FiFa+hogzIjkuSkObkyFtrMhnBYO14BEyil3hgXcycA+TLfFnGkFdJp9UjVf9C1UACbAYwPpBKu8G0iQBBY+xLPyhQsbtd3k58Fap63c7cy7CLNLNyqx0sFuq9fHjMHEq+Ad97Bq2kzO5mGdW1-QaUL0BzBbhhqd2xoVd0zFREu4p2J-hILPn2zs8dq2JO7NgS0giwpA9UCNleCoRUwUwdnTHNAWALxk8a+eSWSCossGCxs--cYlCBzhzBehsI-HJUlSbjDpu03vUVmA6hZZhRsFA8VvycZi+38xWWHNfB4wfsyzFObODqxrEqOwFScM0ZqKQxRMPxFJJ0eHnnzR5485PcYd6BfENSyOazF4ZfmxJ7DgmXvEGmOyzHf5qs-+VfKWP4q94T3ICQnnblrdfDJonwTsfJADMg+IBiihUZrliBAF-ONIH3rI2h4ZazdElJ4dPYvzfkxfMSR3oiBhAgAA */
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
                        target: '#authMachine.active.login.idle.localPasskeySign',
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
                  LOGIN_WITH_WEB3CONNECTOR: '#authMachine.active.web3Connector',
                  GOOGLE_LOGIN: 'googleLogin',
                  ADVANCE_TO_PASSWORD: 'inputPassword',
                  SIGN_IN_WITH_PASSKEY: '#authMachine.active.login.idle.signWithPasskey',

                  SELECT_PASSWORD_METHOD: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',

                      actions: assign({
                        googleOtpCode: () => undefined,
                        googleUser: () => undefined,
                        registerUser: () => undefined,
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
                    'retrievingSalt',
                  ],
                },

                exit: assign({
                  error: () => undefined,
                }),
              },

              loginMethodSelection: {
                on: {
                  SELECT_PASSWORD: 'retrievingSalt',

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
                  BACK: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',

                      actions: assign({
                        googleUser: () => undefined,
                        registerUser: () => undefined,
                        error: () => undefined,
                      }),

                      cond: 'isPasskeyEnabled',
                    },
                    'idle',
                  ],

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
                      error: (_context, event) => event.data?.error || event.data?.message,
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
                    actions: assign({
                      error: (_context, event) => event.data?.error || event.data?.message,
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
                      RCRPublicKey: (_context, event) => event.data.requestChallengeResponse,
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

              signingCredentialRCR: {
                on: {
                  FINISH_PASSKEY_LOGIN:
                    '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                  BACK: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',
                      cond: 'requireEmailVerification',
                    },
                    'idle.authScreen',
                  ],
                  PASSKEY_NOT_SUPPORTED: {
                    target: '#authMachine.active.login.loginMethodSelection',
                    actions: assign({
                      error: (_, event) => event.payload.error,
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

              'new state 1': {},
            },

            initial: 'idle',

            on: {
              SETUP_REGISTER_USER: {
                target: '.idle',
                actions: 'setupRegisterUser',
              },

              START_PASSKEY_LOGIN: '.retrievingCredentialRCR',
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
                    actions: assign({
                      error: (_context, event) => event.data?.error || event.data?.message,
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
                  FINISH_PASSKEY_REGISTER: '#authMachine.active.register.sendingPublicCredential',
                  PASSKEY_NOT_SUPPORTED: {
                    target: '#authMachine.active.register.registerMethodSelection',
                    actions: assign({
                      error: (_, event) => event.payload.error,
                    }),
                  },
                  BACK: {
                    target: '#authMachine.active.register.registerMethodSelection',
                  },
                },
              },

              localRCRSign: {
                on: {
                  FINISH_PASSKEY_AUTH: '#authMachine.active.register.sendingAuthPublicCredential',
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
                    target: '#authMachine.active.register.registerMethodSelection',
                    actions: (_context, event) =>
                      assign({
                        error: event.data?.error || event.data?.message || event.data,
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
        authProviderConfigs: () => undefined,
      }),
    },
  },
);

let stateDefinition;

// @ts-ignore
if (typeof window !== 'undefined') {
  const authState = localStorage.getItem('authState');
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

export const authService = (services: {}, context: AuthMachineContext) => {
  const mergedContext = {
    ...authMachine.context,
    ...initialContext,
    ...context,
  };

  return interpret(
    authMachine.withConfig(
      {
        services,
        guards: {
          // @ts-ignore
          isNewUser: (_, event) => !!event.data.isNewUser,
          forgeClaim: (_, event) => !!event.forgeId,
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
      mergedContext,
    ),
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
};
