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
  socialProviderRegisterUser: undefined,
  googleOtpCode: undefined,
  googleUser: undefined,
  sessionUser: undefined,
  forgeData: undefined,
  CCRPublicKey: undefined,
  RCRPublicKey: undefined,
};

export const authMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBmAIwCAdAHYATHoCcANnUAOUwBYLevQBoQATzUGDmzTuMWB603oWBuohpgC+YU5oWLgEJGA6JPiyAG7kAJLs6fTpAIIAMukAWlSCIkggktKy8ooqCBrW1jrq1vaaBkECVqaaAKxOrg2adhY6pgJtHkZWbeoRURg4+ESkicTJhGlkmdl5hSV8muXiUjJyChX1qpp6pjqavbfGBn161sYvji5qI5M6QXsfQMAhefjsCxA0WWcTWm221Do-GEiiq51qV0Q2jGI0+QWmrT6AlMgzcAk8LWsrWM5NMPjakOhsVWCXh5Bo6QA4uxGABVAAKZVRZxql1A9QMVOM+iammswVMNgC3yGqncHW8NJpfWMJnUr0ZS2Z8R0bLIHO5fMFx2F1QudUQkvU0ve1jlCqV9lJDWmfQegVaHwsWluhpiKxNZvyrE5mSFFTRoodCHcFj9-RMwPspgM5gs3rV2l01gE3V1bxeboMYZhLNNeFS5AAYqwKJzWEx+bkaDQAOqtgAi8dOdox4sdAj6YzsRJMk0+NmsBc0xj692MthCmnUdwstj6NeNcIbWwSAHcwAAjdTMeSkBsSABOOjwd7AJ+IUDIbHYTfSFGwRheyoAAhdRGGjWN2GHSoRXtTEEEeOwHgMHwvlzHd5W9dw1x0PprGBKwp1GatIihI0I2PRsdAva9b2Ie90CfHQwAAW2QQgABt0mIMQMDIAA1KgKHSJsAE1GCobBcnSfJJMKWMQNk7IxJgxN4PHRDTCCFC0KMDD3gMbCQTGfDCNMYjAlIxZw1hVkTzSGirxvN8H2fNJH0IAAzZwSCgKh2K4qhOMIKBCEvLiZGcMgIHkBISBSCQAGtWQouz62o2iXIY98mPcsBPJ8vyAo4zjgtC8LIvQZwEASiQ8GQUUyjUuCx2ULETGldRyTuewDKwn4U38PQdEmczLKCQ9KPszLnPoxjmI87zfM-EqgpCsKIpC6qyAKx9mLETjGq8p9WNNNK6zZJy6NcvKdCWorVsCsqNsq7aarqhqmuEFrRzFdrEM6loeuVfqjMGyVczwgjOgsiwSKm9Krqy+bcuYtjSoMLzkFvCByCEkTxJYfIZMA38mCkmS5IMJtcl+9F-vqW5-kVTx5UMcxDOw2x7jG2GJus8jbMuhzzzm27FoK5a-OYI7CFY9gvPQNbOKx5AYri9ZEpS87hcjUXruyhb8sKlaoFljiFaVlW1dq4hEq+i5mpRBNWsZrELEecYCL6W4Ocw8GhleWxofG+GrMRkXZpunK3PuqXHvNuWreV561d2x99ufQ7jtO3Xa316OjbRk3pc-C35cV1PMexu2Hcap2fpdkcGeTEYvZsPpfb6zmBqDiYxj5ojw8msimWmjLT0N1G48ICBOPZKh8ioZgmB-dgV-oVt6aTBC5Q1N0LBedRfd8SxsO6rxUKnARc3lGx5jHi7C6nziJDC4hzQYAVGGoWMaC4BQPkdAKA7w0gDEsbQ8Kggss8E+HQSSDXlH6EE7g8SeEnBZA8T89ZUVfu-Eg5p6C5AoJ2bsNAADSVAJKQTjM3WCf1kzOlePoNc+ozABjsEuQatwLL6D0F3N0jxnQjEji-Ryb8P6JHnuQWhPJezZAABJAVAjeDgG9V7b3oepNqTMqReHeDqTwPh3gjHzDwncuhVyLiPsgkI1gxF4IkQQ4g0iF5kHbDGZeEEYx0JOAw1uCF2bpjdNYXoa53CBG9LqAwOhgjGE8H0fUeh-CtEcTNfBUi57uNyAOASuR2DMCoIwLejAuw9n7BQIc2i3bJiaCwgI7dgy6kCOYoY2l1AtBCJ8Vc8oCKhhwQXJxCRJEkDceyLkPJMhASUWU8hVDVI1MYQhIwegvC2BLAI4EjxtLehGHw7S3QiQ0hBBs9Jk9nFZJkV-Zeq85kVMHIwbADBFGsGqf4nR7sUyGBdPhSUt9SzkgIns4IzQBGPHlPqI+wJwiDKPBky5YzsmL1uWQh5VSnkvLeUcD5tSEJaElOMCYJgOi2BBOoPZoS8IpPsLqJU25zlXVGa45FNzN73L7I8559BXlDgMLi5Zml9TyjwrqUsntDJym4UMfozoARWBCJYX2U5BbjyRgbZl4ydBvwapxfkyBYCwBSs4GgoVP5-iyDQZR5TKHUJ8VBMBujECWH8N7cwpZupWD3NhN4sTOj4mOQINZehGUapcVqnVyA9UGqNWAE1ZqyAgVyMwChjqvmtCMOMfwBELLmG0MYClEMqTNCCF3E+ayj5H1DdRTVyLtX1Sjfqw1xrTVQE-jahZjB2AdkYDQAU-JWxcHebaQJQq3S6CPo8HppYEkCOwoEXQcNTHaSaJA6tmSkUyJ0NINtvYZCYCbbG6KFr0hWo5Z2uRaamFJPuJDT25JnRvCaNhbozR-A5h1JYEs2CbJDIRSM8Ndad3ED3VgQ9xrE3JtTUs0dANOgirlL4FJVJDDnwhq+h4NhdQdDpWkuFE8mWAa3cB0DB6Y0QY7Xa7tTA+38gHaQqgw7XaCrg8CTpCSXhvGIq8AYENJRXz0KCPcZjiSTnXYillW7oQ0DwI+MAYBP5IhYBwAcewOAFD5Okc91Cr34tBM0DoqFupUlvp0FUjosMtDWfUzouI0ziYA1che+cZNyYU2QE9Z7KM0N8dBGDu8hVjQBB8CY2h3iGUQUHN0I1i1-DsB4I+qrn7DPrU51KWBXPyfbfMqjPbaP0aHbpzS197grjuLiAiupgzzt8OMKcAQzDWKDQ51Lm7nN7SfB53YXmcs+Ydf58B9QtyxMwdpWl8NyTYW0H6SwG5u7+G6HKFrtat0dcfGQbzXa8v9sHYxorrHgjeBXK8AR8MeMXypC0P5NIT50iCI-X98KLmObGcy7AYAsASAgDQMAC8TzyDZXcm1lSmMtwCxAgRI3PYEXnDOyLWJFSxK7mzbS8NFTOmW+Gt7H3MBfZ+390UkGU37fqG0KBeYUnqjTC8PZZb+FygzVZDcIb8PqpreGuT6BPJgBSH5GgUb0AazWHVHWaqo4btcZz7nvPPz884ugOuDbvpCBJ4gNoXcATAlCZ7VCxg9mTi8Fh+pQQC3B0x1IqXhAed84FxnLOOgc7oBOo+M6YvxEvclx96XNv5eK8dvIZ2ArYOk-6OmQItx7GKlLLxoYhgDM6h8P0RL2lzdIt4hgQ9Z4nwQCJ9BoP4PScn2aK8EeYSTfejTJ01mtw1wnOQanll6f0CZ+z7nnFI6C9q5C9S-o2gOmWHMwgZnXTL4hGJIY2Fj2CNhqyU3lvj4c9sGwPyZeXBGCeM5N4i0Uy-P58G2rxUzQcylg6bKkYezCR4TpB0W4R8xUPaFn+57rXG98WbzGrPC-BLCVEn1vxHf98EAPhDBvYmhgRcwONC0hg7BeYqR4YkktAuhNAG945TY-J8gXEhd4p7Zkp0sn9CMpEHozYMCP4-cG4A8m498nUEA1w-BRpUxnRAh8IQgY9EBfBmhb45RtQIDPYH83cUtNUiD0DMDYphccDRdkt-0X9UCy4oASCSAyDld29mNg9EAu4fBvBugx8-Bgg2k2CNCUkC0Ulb5DEqQUChDPx5DP5RDsDtY8CnsCCxkLC5CXFFDG4Vd+UADqD1CxgaRgxuodC0MZUPUARyQ7BuojACIzDWdxcJMZDE4rCsCtZcD84HCZ8nCE5iDXDPpyDiBmp1AqCvk1wKQ8wklyVeg+4sRmZ9BRN3BupDBeDzDMjhCP47cDojonc85+CpDBDmjLDsicD-c8jKCvCvkc1mg8QSxJgRgpwoC1DtJNQjBSw1lb5-BjAUDYBUA8A8A4BYAvJUBOJEjqAmxERlFk0ikewSlWAqFd9Ri25b4Sx5UT5fBiQkl8JvQUkxgAgPhkEeYQsNiJAlYzxkA5N04fw-wAJe1exlMBxSgBtqDfBeg8JtxDCzNb8PjPYdAmhBMn0dw6QLIASgSQSwB05eQ6BGBFESEBxewSFikaY6Z4Svk7gNwAQYk1lFx6tvQuM4lESSxtxb8OhCT0BgTQTsY29GTkwbB+gWgcw9xgw4Z9QPiwkHhy00xehuhPZJ9H80j2dCC+ioA1ZcZyAbDkiJDcEejw1nDDSvswA3CKCVcJSEI7AQD3QNlekIUlT1kM1LAPBtxoip82cJd4izZrS8YkiRd7Dp9dSMi0DPxQzbScilCbQVDO8h9yRdBOpphv1KiEATARoBF-BZVYZJg+DJDn9ejYyDTsYjS2js4OjndXcyzHDXErTqybS7ThiHTCjkxETSt25txtIXgPAK8dQsStdmYSyQQf1tSoygzMAQSIARSSSxSyTikaBWAmx6AaTqBGB6TVdcz8TRokk-i1xZxvRBzNQC0SxVxu4LAUD5yF8lz04CZf8KToTcheQeV9zeTRodlyi0wj5vQdw-QJgy0PhQRQQQQtTujyzw0HzFziT04k1idHTNIu5zBRUjAJhj4pxpVnV4ZoF-B8IC0XUCSYj3dpDSAzwBxrcdjvwOAITAJYSBJ0gikYS4TuyEINwvZQQNwAjNS5ih9Lt2Z9RLBtxgK7zyKBDw0qKaLec6LEQqB2ABx2LvyzBOlgLBNghsQ9DEJILRp4YdwtAPgNxmspKLS9TKyayTSIzUjZy4jnCjSOzA87iuLPgvATdVxnRoccyhy4lQQUkpwu5PYpwmirKbTayHd6yuimz0iWz9SnLEz3D9zmdOlw87h2E6RUJ9d9QHg8QNxYFTCUC5NYAFMIAZZ5AvJCAXdciVZwzxDIzAy4iSqyqKriAqqarRQVZnKRiUzAD4ZlSqQtBiINxUw9kpUAQVxegM1gwxNzLYKpEMYuJ05FLlLVLUKAZTtpRo9Jxa9nj4dEIpR5VQR95kk3QUClrVYxSXyiZKZZJdzaZ9ymC-Qg1b5gQEk2grAQVPh9A79JQF1yR+gLq04xTkK89XLNJzAzAsTiRbAIVRrWDEJuoupQs1kRgQwWcAzYiPdgzioQb1YbKGq7KmqcbnCbZa4kr7Tvy6QRpPhAVMJjlB9twGkb86QIK9wAgwrZDyb1Y1sorc4XdibsbpCyb8aequyIbNq0wRoj57AtBLAuE8LEJqjBMJg6ig1bNSzzSFqxkWriByqnpSprLNZbKYLmydA9aDb-JnpErBjciXK+rqDsxdBHg-YfA74aceFD46sqQ7tByV0ubE5FEzxcglh6q7ChaKKKzZDg7Q6sBxaUqVwQLcxggklQ93AgLoapS9x6ttJVlA6zZY6w7CaI6za4rcbPwi747KbOzlCwdAC6Uxgdw7gQRljV1M77hs6CIehARMaZySaRb9Sq7MBIrHcGzI7pLLKY6Q6lgE6Nr6h2CUFNwn0JgSxBKPgvBgR0yiLmbPYUCvIPtYQoAmwnwYABxGoCaTaiay7ozXED70Aj6T7Hwz6L657OKhUAxfrPhLFD9YYPiQgYbwLv1Aq3h97D7Vhj7T6wBz70BebM52iBbGztbzb77H6oGYHkA37Jahs+KARegBFpjcw51BopTQicTug2bSxkD5rzbnDOQJB34F5EiS6Uib6gy6GGGoAmGBj64lD575iVwHgOgBEhy1x3hKU1lvY5QjFPAdxcwC6-J6HGGwBEi+ax6YrkHy6OHlGrCsHHaxi3hB417Ft6QvqvaiR9BbgeMFwj4tb8Dy6oBOHuHWiWGzT7Hb6dBHGdGeGldkr+GaDEk4kytrFcxiQDrtwkkWhVwuDhqGt1iaGHGnGVGRCr7S7YqPGvGuHknSCa7mpkz67vC+TvBDGSx4DPVEaOgj4HggVDAn1DAjAUDMnnHCE1HorBa2G4imnsmFDcneqCmxj7s4lfZX15tHgQViR9AxL3AbAgQkliqvcrcZdzY5M8ZiBZAo0KBmAKBw7WH0mgzLdrdy4VmFN1nOJNmKA9H+m6knhRpj9Vag0yU9k9wrEZjDA2ZEN5mudFmZZjm1nCANmtnR62mkH3H9mFnDnlnIATn-mzmtnLmAlUywkKRKc06RGcM9lBNOkg1kdPh9IsKNizUfmoW-mAXtnPNrVet7V-99G6kObRoFtnRzAcx+gX0KROhSx+klVSUCW20iXVnTnznxT36AZ3rmgmhMFUJsQEknmcwVSdR3hFshq+6OmcbgM+XoXSW298mEXACb0PL4NJx-Aj5b49kzAwVOgT5fZlRhqeXiB1WSXYXtnNtqNe0dsGNQcdXvDJgwU6RV1vWImMXtx6XyR8quNpyVXpC1WjniWBXAXnXts6NdshxtXPlkxfYeKYF8QTJS09lQKiUQ28xJhbEFHPwKAwAwpYB0ACp+RUBLwQo8AKE41mBfnTmdm3GdT2H9Sy2K2q3Hwa263CAG2m2W2YX4XU2gkrADFUMZmwkC1NBjINQiQByRGKxHgS2oBu3CBK3q3a363G3nBm2Y2YW23Grhbo7E5N3t2+3d3B393D3+XR3emVcU28VNIN7YkcNIVpblVjIdI9RS0uXXg7GO2HKu3y2t3e3+293h2j2o0T2J6LKYzZDL3IOb2h2D2R2o0E7PCaWgkzBB4pS8yPAdxdLU77gvVXQg0C112UOd2B30P72NXOJ4OI3z2zZaPr36O73MPOIE6CjsG1CqOs03QnhdQwlBLIYvBljWZiRDKktNGPHnCOOoPb2YOH24PWnEGEOdb4rKzlO0PuPYPeOn39zQl7h+ltIiQklDWX1ughm-T+Ttw-BgP7LSawOe26PoOMOjOgWtPWPLT3OIPPPVPvP1PjO7akzhWhsvVNdFQGsabPaZV-CsTmS4CTqOgXOB65MPPnxWUrVWBoTAFsAaAnk3kCh9yiRDselkcdxpHB81Q3qhnFQVUrAwnJKsaKLsugvcvrk6A1q-5T16AKBcgcgOBJJpJZJTOghfCKiixBEwDlxiK4lWhBzJhPiWsuur3xkyBcl8lClilSlgdBwKv3AMzmYrBUJw9Eabhup2MTAPAYVEt8INvwOtvWU5EZkeUVEwJ15N4tEouPY7O3nghAUaQQtadcIYFnPJwpQu4XucvtukQf4BuAFhJgFhIpu5V94qO1iepruVwtBxh7AYfeFJ3w29nHJNve3tuN9vFL1-HT40rAhDBdxrP8ebssS9wBEsFg53h4fuudBe3WJYBsAvs4PmBoxySiuSvsAyv8hTPPgRp8Jgw2hZUQ3lwzA-RTGCIIighOaEnqIqeCpt1WrDauIWOKeEgjfnxSr9a8bSox3X2RXwssSRFc0c0WXBobgpjRp5QpynQcJ+etvbera6rNPOj2nLeLbXvqeQ-7euJHeWNSc06UJkMaVcR8e1lpQ79LFosWf2v+7hbreWJnoBIo055cjv9CYJI7r5f-HV631TF6Rbhz8vedlSsAwU6dQQsC+I3i-Lqy+QoIBK+waTuXgYbrFgxfUAhFuMK0wQRPAcIC0IQDep5+-S-y-h-CdVqVK2BYSKu7BF14Zbh1dcwVxlwUlzO0wgrAh1Kg-qfRbSoLeFO1+Y-jfH+E+TP6+1wxhLvcLL-Zgy4KfjKB8CAhfUHge-u-31J1VXGp7Trm-1LiJxuqJnF9kn0QCH4-Q+iLuGuDdAK0NeQaKJp8Bxb7JbAkAxAWbBgGpNdmL-SnggIrrW0HeJnHDlcwQgBAkSVgNZF3DW5hIDqNwekJhm4rXwc0JgMgfQLD7wM6yfnKPsXw-7hdeGfjAHggA-QTEekhhWxGuEW4UhXq2gH4jfFAar9aBCPWTGAEahgB58i+VgMvlXzFIUeQ3EbukA4BPVbMmuR4CZGIpuhlwcXLEo8DeCBVQBDKAwVbzoHGDTB5g3PFcUYDpABwy8J6toFiRIYVUxiEwMCi94eBFQo0UsKgllpvVRBIQqtmENH7+NBMIBPwFYyDSNITWqQ8od4ElDu0twR8GwLkIkCsRDoH2PyCh0fCV9YB2nK6MX1fAtCF4sgUtjH06GihE+qhXMsGBm7d1yhnwD4J4JsBHZc0RA3cFoCaEDC2hwwntqMIuC+cI+ILEDkEKMHNDWhQwjdiMNyLjDUyp2EaL0ALRfAEkfpIASHAgIrgFwGVBxIEOj4I9UApVR8Ie1ME55jipxRgOcVoAlct4Nxb8iMFuF0pKuWVfwEAMXYmBhMsNU7KIMtrtCLhXVZ6M-1BaGCBemIrYRBx2HyBkBEXBQQJxoI-9vB0TRUEEFuCeDdQ-odlg8XMDuBPhHXFLMXy6bMMqB7bVzt8IF68ifGQxB2iwMhq3xf+vBIwN1Chr1czE7GKzkkhJSmZ5O+Io4cKKSZ8ixCaTGgZqK24iicmFIqmqgImETBuoR5VXq0BnBmANedwAyv9VXB-9ugogo0S0wkH819hPQg2DyO1Gij7afTT1kUTMxRNL+MMREoHF+BphmgOobZKYn6BTkMR4LJZswEBbdC++dAg5qmLhZf9FBdISJseVepR5gw87L3sfk0I8Z74k4ewMmK+YQs0x2zcPuPUzEI9sxMsXMSaNrr19oc3gX2huDBCrg9cXvRXnEh4yU4XgRA+JlyKkLF9I0nERsa2nNTdYKWPYTtLYIx7+NkanSXwHYB6RicB8BYVoDuMwiNZZwfSTLkXzoHzjFxCaeNjRjdaFZ-GuuJHMwnMDHirGBYD4OxhBA0hyQkMfXjOOfxziG0C4rZkuI2yUsXW+WJNnXWDHJhdc9wHEmDxeLOkCwOAgEKJXvhvAo81DICb0OvGgTbxbaIVlSO3GhE9xqguAvV06AjZahZ4h5k6FEHzjzmEE8ltpgkgfkvyW479PS0nGw02gWCAsJKBQSkoTEMCQyJyML7wCEeLE8CQmjBoRCohMQrcaCB3HdBOoivaiYtybr7iCxjE-0tJO5F0DgS5wT8E-UFYAISEaKW1H-luK4dAsCSOJC3T16rhDC2EaUNsj3FGtxi6ow4UKOD6m8oAKnPAIxwdZ4j-JxfOPp+BClhTTmVwwAjcJaA51Wg4+PUAWDRwpdv04SGmsCFEHRTgpaHOKce2bEaMNRAU2PkFNik8cEp1BOkCyWc465Pq-qAsKdjwgXdUMyGUePhN9FZiEB72T7N9l+y5RdhdAVFByhBz7lLOI2MJA+iLZGBPBAiYpseSwSwIq0Xw4vtbwGm44hpBOUacQlIQcTf4VAf+IAimnmBMBfgdygONOzLgoUlIDUvcJeBnxkxOXbaXjmGn-ZP4hQ-MToTwg-9vKD3OkHdKhiCZiQjwITL4LrHe5S26Y-kXAOMltiUx7QzsfIKppFDZg3gXwAgQ+AmRWpl2W0dqCnCmU-JgozacjNhlNjPR6jSPvqIqnG92xlM2qUyVCyUg9BkoPOoJVUBHVgw7wBiZJMvEySBeBUuOgeiKk8cIpZMugSLKWDVSjOzMnsjMQeDI4phmyJOndLpD-T2WzoUEDgMFmIzhZQU0WXLLC57CWx0g6WUbNlniz5ZeYqkZ7DTAAh9Ik4zZFSGXDgygmveQIAEG6CSgWszuRxu-kNSf4IAiPJSrvzeQcUqR1mTQpUw5q39fYwkjLkIwJ7pt-xDIL4QHIkBBzYAIc7bopRsmTSGejxAiHcGGau0T89o3QPVkakXclsmc0+tnPMEm87e5cCKhmKj5Zyc5ecgqbbTRndjFBwjD9rNNXB2Ak6ulQsIdlQRCIvgeJf2Y3O7nZ4W5VtGsqVNpnlSu5zc3ue2TtkOSAYIVLEqjgCBT8jCStBrqOQiL7hqc3xaCp3IXnNyqKYQ8Ev+EAhHcqkT1QIDySDQnw74d8CeTMU3o6g7szwBdL3zvnP0m5H+JebAGQBLMwhHcumZvKgUL5t0sCvyOYIVl7xkaXSLuFshEQEogBU4IZkAvwhzgNwUkiNkguDnQK0FMU5BTnjXkHDBRVC3OTQrgX0LMFmkT+pONxCThMEk4C-uPzlFTl6sCSbBGRGIA2l4AFQbolSI0BCK2gayWiRQ3CTCSyc-CAas6GvL4lzkSQUWHIslaTMDcl3O4TPyqEnwDK+JRJOSl1AOYqRq6McmXO0AVziQwkgfGOVXrMkH4+sqQijAliPgqRA5MVriFTp-AgiE4VcJqDhrRZggBoL4X4tjh3RXwiSvyIEp15CN74PcAONzFLChx+YI8UmQPQSXGwS+pUHiG-jSWRM2YRDf2FzAhhvFfeYcBGPEvFiJLJYlZFWOVE2hVQhgEogGNI06TVLQYvcKMSmEVCeSIxcMZpT1KLgzw7ol1eMpUsGXuhhl2SiGGmCk6TKBYLWYpSXHoEVwU4PNJZRkpqVgwPJjssyPkumVGTfFrSkpZdXogdVWIkAY5UMqyV1KhgWgAII0quURwWlMcEpcikqXShFe3AvUBrSmzBgWgt+ctMeIoYN4qRkMWmsdi4xnYu4U2TeiuDJxkojAZgW+XTJWwLxEV6uI7JxlOyloKmKSTerYBMKH4cwTQFAnWnnHgY40S4sif0jwYhV8OhIYcf3A+D0tcVrwOUEGjwk3KdOWqEjPuhZW9L4JKyPqNUwSTggLRWYU1uP1bpFh7uC-RlVJiWCZYFMiK-EDUUQy2BamYzCGJZmh5hJ5Q4kihVH0JUJA1sBqy0b6mJnPMegStaZlXiSQvA6Qt3ezF8M1TY5Bp+OEaW1HHZvscIHi6zF8tlqUpgQ3gY+UByiJEgwFBKjnBTKgBy50A9iogRkKwT4RLOBafXJmlmxhMtFc4cnmmtnxv5zB9itGqKjCSdAgFIVCvA6O9amZD+-45VnaoC6VkrCVImFH6HsCIlZwUw14BXkeLJCgUOAnwI0IDXhpNi2xXYvsUOIuJAlt8DQgSmZqWdjx0SPcL9TuBUgiQySYkEKSfLYx7ZUFGosgmmZ+ATAtOQTCl1HnE9Mhvsddosr3kL1wKPJPcAPh+KewPiHgMckqnUIM58V5UzVPBXPXIBo5PyA9ZOiaDNJEawFcYDD2DAL80wro+dVIlkq0UwA9s+Ag8EnbvjFRulDVaKjHx95ShfgddkaSpHYZpQOveBHrxSSCUOMY5XUPYmIjEp5m289qtVXYg4jSo9GjWnVhwENYpw4jHhKHld7BxCyoKUEMDRrgwbP1iAO4JOHpYs9wstBXlViC+UeLfa4BHMLYuw1IckB+NS9ZrN2qp0Bxi-C-Lkt6B1EzIQiO4LxqCkqw6Nqm3MpCl+pRF4CYMpWhmHNa7UIZPhVNRBt7XT1RZ9sq1T+su5BoZwoy2rlI2-bEgdw04sVSg3AZ+Qn6L9WBmRNLFSN+kETUplySq6zzOoXCcLf5LY6KN-RH8exXrx5L9BmcjWcsJSiDbYVeC+IMTpWoi1SJ3R-0cNSK2GqYYjAU1X8T4PGqPE3hJYJfjSttVVrdaGa4qaS3sUZo6sGtbpP+MEo15dAjBN5v0Ashy1bW9rWNhQAHW0hfezpbED-102IRJ2+gGJOOmEQM4aOCAkKYZzC72KVwxYGmpYAeKA0psFjZmETK-RmAyBiK+7nVmzCYb2EE8kHi7THxn9AwHwUQUCq81Wd8yt-XFXMF4HPBpwP8z2DSDzqirWxAvIXiLzF6cRLtboX3nwuiy+xn0qQ8SkSi8q3w8660mZa-wR4FSVY9ihpf0CmAvAws7xNvkFUmY8DIUiqFPBtLoED9N+uRAdTAQ8UKgURZOfHjM34TvAJgk4UJqIjl0I9ZBVImZr4QTlvU7gvQC-rfEmp3DbEWgBLbkLkyhD6F0ch5tAm-mThZ0bwBYeZx8H0i-AZKHxcBOCEnDBhWI7YUrq80CIUkrvcsAgU6ia70hInNhENX3iFKrxPwv4QCKrYQBL1NunpJa3cDZU2+9IrElMX1DHr2WGeoWVtyJHnDI9QmriAOtqH8IFtvqX2Rf0WGoRV0GEVMCZu50EjDR9WkgAOuYIGVf1cMbKfgN8JWcqxKajLeTrr0ratmJu2BKNHw70g6irfVUDmEGUiMOa2kRzcxKInyS20Bqx4sdtZ46EfAR4gmaeP0kCyT9uqViWagv2LpfBlnG-QjtBCUgSUtgeGGJysCiDTJZwiyavq80GsYd1++HfjM1z+FaJhgDWtVqlm86qpNs77dHo5nBZBMMMeifV3hhjBws1EnMMzxr0Gzl9b0nHB9L2lhqne9QQ-GMD6SuqHuCo7AWOPsTH8oUA+zLb1KRn1ilm5zaOewizQXcqsjLa7qvU54zBxKvgchflKtlgYMDTHe2S1vGCuCtww1N2W3xB59jk1qKiAQ3IgWLyF8Oa2JKXNgS0giwvA9UHRO2QroNwe4eecYebkY6+l9QQxr72eKEQO1XMgkCnJIoNYH0zhwOVvKCmeb3DWIbFl4YS2dx3aZ8rMjUX4w471Ci2jeffPoUvgbSP2NZoEtnB1Y1i4nYCgIpZ2EotK8oUTD8RSQhHIF1ClBY-Nd1ebegXxDUsjmsx77CF8QgKuSGGZZ9yDUhFhT3NoXBTGjkRvSvhCCYJ4T4Pq39Z0dCJipe8Iql4DUZMOhyxA9C-nGkDz1ebQ8MtZuiSl6AfouZMxX5N31lL8ZSIEQIAA */
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
                      socialProviderRegisterUser: () => undefined,
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
                        socialProviderRegisterUser: () => undefined,
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
                      cond: 'isPasswordAndPasskeyEnabled',
                    },
                    'idle.authScreen',
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
                      socialProviderRegisterUser: () => undefined,
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
                  },
                },
              },

              localRCRSign: {
                on: {
                  FINISH_PASSKEY_AUTH: '#authMachine.active.register.sendingAuthPublicCredential',
                  BACK_TO_IDLE: '#authMachine.active.register.idle',
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
            socialProviderRegisterUser: () => undefined,
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
