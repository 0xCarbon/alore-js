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
    /** @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBmAIwCAdAHYATHoCcANnUAOUwBYLevQBoQATzUGDmzTuMWB603oWBuohpgC+YU5oWLgEJGA6JPiyAG7kAJLs6fTpAIIAMukAWlSCIkggktKy8ooqCBrW1jrq1vaaBkECVqaaAKxOrg2adhY6pgJtHkZWbeoRURg4+ESkicTJhGlkmdl5hSV8muXiUjJyChX1qpp6pjqavbfGBn161sYvji5qI5M6QXsfQMAhefjsCxA0WWcTWm221Do-GEiiq51qV0Q2jGI0+QWmrT6AlMgzcAk8LWsrWM5NMPjakOhsVWCXh5Bo6QA4uxGABVAAKZVRZxql1A9QMVOM+iammswVMNgC3yGqncHW8NJpfWMJnUr0ZS2Z8R0bLIHO5fMFx2F1QudUQkvU0ve1jlCqV9lJDWmfQegVaHwsWluhpiKxNZvyrE5mSFFTRoodCHcFj9-RMwPspgM5gs3rV2l01gE3V1bxeboMYZhLNNeFS5AAYqwKJzWEx+bkaDQAOqtgAi8dOdox4sdAj6YzsRJMk0+NmsBc0xj692MthCmnUdwstj6NeNcIbWwSAHcwAAjdTMeSkBsSABOOjwd7AJ+IUDIbHYTfSFGwRheyoAAhdRGGjWN2GHSoRXtTEEEeOwHgMHwvlzHd5W9dw1x0PprGBKwp1GatIihI0I2PRsdAva9b2Ie90CfHQwAAW2QQgABt0mIMQMDIAA1KgKHSJsAE1GCobBcnSfJJMKWMQNk7IxJgxN4PHRDTCCFC0KMDD3gMbCQTGfDCNMYjAlIxZw1hVkTzSGirxvN8H2fNJH0IAAzZwSCgKh2K4qhOMIKBCEvLiZGcMgIHkBISBSCQAGtWQouz62o2iXIY98mPcsBPJ8vyAo4zjgtC8LIvQZwEASiQ8GQUUyjUuCx2ULETGldRyTuewDKwn4U38PQdEmczLKCQ9KPszLnPoxjmI87zfM-EqgpCsKIpC6qyAKx9mLETjGq8p9WNNNK6zZJy6NcvKdCWorVsCsqNsq7aarqhqmuEFrRzFdrEM6loeuVfqjMGyVczwgjOgsiwSKm9Krqy+bcuYtjSoMLzkFvCByCEkTxJYfIZMA38mCkmS5IMJtcl+9F-vqW5-kVTx5UMcxDOw2x7jG2GJus8jbMuhzzzm27FoK5a-OYI7CFY9gvPQNbOKx5AYri9ZEpS87hcjUXruyhb8sKlaoFljiFaVlW1dq4hEq+i5mpRBNWsZrELEecYCL6W4Ocw8GhleWxofG+GrMRkXZpunK3PuqXHvNuWreV561d2x99ufQ7jtO3Xa316OjbRk3pc-C35cV1PMexu2Hcap2fpdkcGeTEYvZsPpfb6zmBqDiYxj5ojw8msimWmjLT0N1G48ICBOPZKh8ioZgmB-dgV-oVt6aTBC5Q1N0LBedRfd8SxsO6rxUKnARc3lGx5jHi7C6nziJDC4hzQYAVGGoWMaC4BQPkdAKA7w0gDEsbQ8Kggss8E+HQSSDXlH6EE7g8SeEnBZA8T89ZUVfu-EgiR57kEgpkIC2QAASQFQI3g4BvVe29m6wT+m3KkXh3g6k8D4d4Ix8yDW3HoXQq5FxH2QSEawkcX6OTfh-IhC8yDthjMvCCMY4xMPUm1eo7N0xumsL0Nc7hAjel1AYHQwRjCeD6PqPQ-hWiSLwdIghxA5HkFyAOASuR2DMCoIwLejAuw9n7BQIc6i3bJiaK8cYeh27Bl1IEPhQxtLqBaCET4q55QEVDDgguDiEgyMIXPeRFoeRkN7JQ-x3YaAAGkqCqVCSwhCRhok6FsCWPQXcPCKgSR7Cy4xfBplBLfSYe57EzXwbIwp7J6C5AoJ2SpNSJKkOgvU1uCFnSRPaeYVCARgx2CXPwu4fogT4U8OYCxFhRmT0cRM4hX9l6rwqYEwcjBsAMAoawEJJxmGrM0qhDc+hjBbm0lSOwtxvRym6nhAZliInBnCNko8YzrkFNuXQe5cynnBJeW8j5RwvkaPdggfUioWlH2mMEWGbRwVmQBMEQIARtImFzJcq6+TnGTJ0G-BqnF+TIFgLAFKzgaChU-n+LINAqEBOqbUlRUEwGaMQJYfw3tzClm6lYPc2E3imM6PiIkNJol6BZQbNlLjOX1WQDyvlAqwBCpFWQECuRmBVPlYS1oRhxj+AIhZcw2hAXc1aLSruJ9olHyPsa6ipqOVcstby-lgrhVQE-lKhZjB2AdkYDQAU-JWxcE+baH5ANWjaABBYuknxSwWPadhQIug4Y8OBU0SYEbxkooXjoaQSbewyEwHGm10UxXpAlY86VizVHLPxWEtZVj7iQ09uSZ0bwmjYW6M0fwOYdSWBLNgmyOSkV5KcWaztxBu1YD7YKh1TqXUrN3r8vcpi5S+BsVSQw58IaroeDYXUHRdTmAkQiierLD0cuPae3t1qL0pplempgWb+Q5tmVQfNrsGm-OBMkixLw3jEVeAMCGkor6CPpLw4kk4W3IvZcQ-ONA8CPjAGAT+SIWAcAHHsDgBQ+TpBHQs11yZur-I6KhbqVJb6dBVI6L9LRokRM6LiNM5GD03PbdCGjdGGNkEHcOqDY65U3vAfUYTfo9xmHJAId4hlEFBzdCNKkh9uiGFxILceSMTXAaoyp2j9Hk3zOgxmuDCG828cacIh4v7cQEV1MGGtvhxhTgCGYYRZmFPmqUwkPaT4NO7C0z5nTajJ2oaLVoUxmDGUmHhuSbC2g-SWA3N3fw3Q5TJajVR9Lj4yDabTX57NuakNBbQ8EbwK5XjtPhrhi+VIWj4VQn4NcPhghNcPWy7AYAsASAgDQMAC8TzyDuZvEdQTkMt1vRA9pxXPYEXnJWyzWJFSmK7mzbS8NFTOgW7IpbK3MBrY21t0Ul7nV9ZO1AvMNj1RpheNSqx+hpPuqshuI1AGXORsPXR9AnkwApD8jQS16ANZrDqjrZzUdW3OJR2jjHn4secXQHXC130hAA60e0ozwJdGez+eCycXgv2wqE8HV7hDSeEHR5j7HGcs46BzugE6j4zqE6kYpgXK2yci6pzTx28hnb5cLVo-o6ZAi3HEYqUseGhiGGaP0dBU4XjaX5+y3iGA+1nifBAP716tfHa0SfZorwR56KCMYb0aZkms1uLN2+yDbfrD4ugR3zvXd4oLR7xATQzB4Wib7YkwZLDiYQHDlJl8QjEg4fC3diKrkK7t9H2Pj4XdsGwPyZeXBGCKM5Mo4pjA8uJ-08nxUzQcyliSf0LQ3TEKEjwnSDotwj66j8JHkgVfrVO5r4JYSolcsTq7wqhAHxDDeyaMCXMmH1CB7uKNEFQfh8gk0JHh6Zt8hONx-Fe2yVUq4P3Slwht+-L34-mrhuGum53du8EA1w-BRpUxnRAh8IQgTdEBfBmhb45RtRD9PZH5S9ANXNZEv9Pwf8SBH8tYX984y8gMsCE478nE-86cE8UNtdEAu4fBvBuhC8-BggR8w19BnQdxuojACIqQb8yDv8H9Yo8dn8Cdn5ckP9nFsCoBcDiBKDG56cDAgCt96CxgaQs81VWCOcwDfARgbFb4OE+CEcicKN45TZBCP58D8dX891y9JCzCy4ZCKDPp-9iBmp1BlDCU1wKQ8wrEQR-B3RwVmZ9BSN3BupDBUD+DzCcCH9WsJcjopc845cJDTVpDZD5CAD6c9Mt9vVmg8QSxJgRgpxj9Bo1w1CvhSxolb5-BjBI9YBUA8A8A4BYAvJUBOJZDKAqAmxEQqEnVvEexfFWAakN8aCk9EJw9dB4YT5fBiQrF8JvQbExgAgPhkEeYPgS8hZbCSDCFYAJAlYzxkA6N04fw-wAJM1exmMBxShsjCVfBeg8IBF1lQUjFBp9cWk2hJx3gdw6QLI6i9j0ADijjsYyBeQ6BGAKEZkBxewZkfEaY6Ybjkw7h-kj5DBolFw4tvRsMzE7iSxtwp8Og-j9jDiwB05HV-sESEIbB+gWgcw9w4VijA5EB3h7htw3g0xehuhPYNjkj39UiBDPw1ZcZyBhCn9tYbDiDMDP9+SoBBS1swAMi3DADN9bi+oHgMljMTkbAFi3QWl3VLAPBtwjD0DEdicHDE5ZS8YrDRDxSMCkdSDoiZTsYhSFTmobRRjgCaQS1Oppht0+4mTdR9AZ0h9YZJg0DNiJS7SpSHSLTyA4jJdpdZdxDeTD1pCYyXSlT3St87iWT25txtIXgPBA8dQWkWdmZQyQQd1wzbTTTMBDiIBASSTgTQSfEaBWAmx6BoTqBGA4SGcmSfjRorE1i1xZxvR8zNRAUSxVxu4LljD5d7Daya8Gz04CY19wSLjcheR6AKFeyEAcTRpHh+9-A0wj5vQdw-QJhg0PhBkwRuSky7DTUFz6ziTSSr0dyu5zA8IvgJhj4px9khhLBTI-ALIPgQh6TI9SAzwBxhcmjvwOBTjAIriBJ0hvFLjrjPDkwNwvZQQNxuoGtzBjEJt2Z9RLBtwzyZzjSTCK8dAIKoKMcYLEQqB2ABxUKdyj4PyzzBFghsQR8-UztgwbEkCNwktZyUiUzpShSrSxSiDqzTDpDnSXCqCKTNI0kvB-dVxnRzs-Tc93AzFQQbEpwu5PYpwojHCJK4yEiEzpKTTZLxK5T0ysj0KEI4dkl9c7h9QEtUIOd9RQs0I9Fu5eDI86NYAGMIAZZ5AvJCAZdXCVZJLCCeT7zkc4AQqwriAIqorRQVZ7LWK9x7gqQtBiINxUwgimgAQVxeh3VgwyMRLkzZEMYuJ04GKmKWKlKAYRtpRjdJxZtpjrtEIpQARfALE3RrE3RI86rVZgSVyiZKZZJuzaYdyoC-QzNb5gRBr6VwU-l9Bp9JRa1yR+hRq05gSyS3dlTkwzlcriRbBHgVjXhwV+MaSepPBgxPB4cKK5y+SHSbZgSRSCCxC38Er7THDPrkAsqWr6grAAyK01UOE9LbrIlehOktRV0AgTLE4gaxcDoLKki7ztipDpSgaQbHLNIoCRoUSBKALXQgjBEQiJgwizNZMwz4qcadAgrkqnpSoJLvrrCrLKL7CWbiBQq2auJ5Ln91dFSHKTqEJsxdBHg-Y5sv1GTeqRhYsqQ6QNUzARlqr-qozHCKEzxcglhYrfqtjJTcaHTdb9asACaJblKVxzzcxggrFdd3BTzU8qS9w4ttImkUazZzaDbObrTua3qxKza9algsq3SjsPTdwpM7gQRKimg-zFVXbD4CIehAQXqqzrKqLpDfasB0bs5MaZdA7RKAbE5c7MArbMzbixozFNwl0JgSwSihgPgvBgRTN-BfZ9RPZI8vIVtYQoAmwnwYABxGp1Z-apLGaTadBe70B+7B7Hxh7R7K7I6t8dxgxNrPgdxiQbBYYFiQgWlLtt19K3ge6+7VgB6h6wAR70B1ZzLc4i7J7IznEZ657L7r7gaFKFCdznQJsrBQ9Cjcxq1BoqSAQlqiRwbSxyRva-JOQJB34F4Ojx64rsap7pDYH4GwB0jP7Mi3zehpRPAjAdQcJljwU2guddFOFPAdxmVNama0G4GoAEHYjM4Mb77Ey-q6HpT0HGHMHnCRbXDNdraIE2Sz8-AGt6QrBSGiR9BbhcMFwj4GaUGn6dAoAGGmHLCkGjaIzTTVGMGsH+HFLCaAZO6+8nqnRFQ9RbqJtAGLET4l1tVI9dGeHEHNYubH6dG1HeHf9sGxbqCV6vCQhkkYCTEBq30hgOgPgHjPYqHoku7r9aGp6nH1G8C77EiH6lGPG9G+H65DGhGtEghklXhsRMkBKeqOhiQOC2c75jlFGOGp7Bdhdy46M8ZiBZBLUKBmAKBDabSs7ealchdydzZmmGM2nOIOmKBl7vkxi9EKRiQQRBEJh3gghwU9whEiiHN95bBAr+nGmhnIARnCB2nOn874i2Hi6arFdUcBmZZhnWnDmxnOnJmCVwkngODXgtB2kLFPKDkwCzN7tPh9IjBby6nlHj0bn9m7mjmunNNJUctZVO8q7wkcrRp6tnRzAcx+gV0KROhSxMlLBfZJQ6iRVwWWnRnxn49Qa6DUJmgm0DELEyxNAVmcwHgT5dQSxzsQgM73HTCwWmmIWyXjmjq-GpngCgzaVVmZ0j5b5wUzBmgIi7HHh7B8qiWk0SWDmoX2s4WYNM1utENDsRWVDJgdUmVQQZ1IZwVBFW7Q16VFQJgXsEnlHpCKAwAwpYB0ACp+RUBLwQo8AqlbVmBbnRnunzmtbTbHDnXXX3XHxPXvXCBfX-XA37mnmp1NIeZ2FX0bBmTAVGX8MNQiQ8zPmKxHhoHPwI3CA3WPWvWfW-XnAA3+X7ng3uXs7pSy2K3o2q242a263SWk2fHXSjGtEvndJ5R8X2lMX8MdI9QggrE0wOgrES2oBW2o2Y3q2E363LVG2MmbKHSl3K3Y343a3E3LUsqlC8nk91bRoqSTAHM16L5cINVXQzNAUF3d32392u2j3OJN2QXTSnWXXy3l2O2D3u31XOIsqPCz2QCn3PU3Qng2X8KIZ5QvBKjWZM9gwnMt3m2d3-222V3O212e2N3UnLKm37C-3I293V3D312wO+2Mz-Hwk5RcrfZtIiQrFJwm6JxugzETG8Ttw-BanjbHWW2cPAP32CPQOTn4ysaf3t3w3RPKP8PqPCPaODGv6I6DW3UNUAQ1wLGEsmUVn962g6QQVQQCHBPtHHI6MKPnxJlzR3kLjAFsAaAXkPkCg3zqjxz7sdw5Q3gCxUEUFdOpwQyulktrOAOCoXEv4mq-4h16AKBcgcgOBJJpJZIdzbBOhvBeg3Rjd8J99lx8JpRgg-caQ5hyLM6ebwu22ou3EPEvEfE-EpUDs3zDE+lSMSLswA9BobhcLQt0P9FtBUIwuFPbPbkllyEtzqEwJ15N5GEB2PZuOHNghIHSuzAIdeYTNC9oCpzhubOoukQf5YuAFhJgFhJ0vYk1TtA9Q6QepYDhhs2olBETldx9FduIvRv5EW9lElk3yRgXLAhUTWPuo7ubgaRklWlNkOl8J3g3vquo3WJYBsA1sN3mBowwSnOXPsA3P8h0vPgRp8JgwyH2OVxlwzA-QJGCJuCghkaHWp4quo2O1Wb-Jnpv2hO6eRvGf+bipnpk2Ct6hsNdATAVxMw2quvVQ5RSwz93BJwnQcJYeGfgqufBav3iOZO2erOOfFeBbmfSpefaDt9HaUJn0bFQ1VxlxolpRp8t7rNUTyvSP6fIuxqBJLU55XCV9CYJJpqcfKWEAG7zyX1UJn0XgxffhWYUk2hZwLJmSLOZKEgHfnwneXeIA3ehWfeVrTFJyyiQ1AGCuPy0wr9BNN0IRaeNe9vE+Qpk-ftGrmK2Ari3y7A614ZbgI-cwSfuuDdcq0wDLAgzAY-en4+zSzYYrNGenKuOfpDMq6PxbEXKSLJLeuTbAIjbbzePBP0sEaa2grB5fIuJ+WeR+Q2roB-d-dep-hXnnKSLfxg-1AhN+0xE7hh+kzFhol0LFeF-1XqJCj+8aWfVf0nZO4-x+3-E-mpxwY+8N0eRNJDYl8prgCuszS1vOFTqfFt+z4TzI1DADV5a8rAevI3h8RHd4uiXdIBwHmqyYdOjwEyIVzdDLhbWLSR4G8H0o+BIiJfAAXt1QHusMBruQYh3gHDLwdy5aaUPS2dC3xjy-qdvoCnuBZ5Cu+oScJWmQEvg6MaA9gan3m6+9psUmNoAlh8Brgc8NwG-mYgPKdVAmr6WQa+FYiHQVsfkJdo+Dd7797eHPEwWYNkCltROVg0UHrzGIBg1CncJ9OWg+BUCbAg2H1J8DeCD5jBEgUwQvEcGLtnBbvX-uw3V7MD3uL4MIQ4IsHRDXBp-H3iNhGh4N1kQvQ0suDpJmIJ8aSBlHYiYHM0OeqAYKo+DrZoCXc1AborQF6LMB+iLnLeMMVYp6Fxgv6IkIfgVAFC82ZWHLpm2MrlCB+fNbXpYOip79XGAdWwXtwmGpDI2Lgi4JPxAG+M0+ZRGgauAPJBAwU7fOkCNFkYzFJQWyQlmMI55JMvGeBGwZhwqF7crh+jHJl-TAFCDsS24IwN1DOTaDeEGGNjlYiF6iYMO--e4YkMeFCFZhE9O4QP3BHeN1h-bSDna10CTgyGrQGcGt1EGn5ug21VcIH3AayDYRKTFhgXTObzCwRnjJ4bTheHKDCII0SAl6kIhzMCh+ET8sCGb6WIKysghpoMxaFdNbhII8YTsx5GPMMhygukJDkHJLUjcT1AsP3kYK4Z74nxLltCI57ciZYxzWIQfwNiCirmuzXkW4OALaQ5Q3gFWhuDBCrgQ+DQPHmYlwwg5g+Fo2QTGk4i8jE0oqLLLCx7Cpo8BZ3H3vxmST9JOoePEFNoNaD+jMICWWcBkj75j89uTol0fag6zat-MPWfVuf00h+jQGdgNJGy2zwFg+q7SazDPipBzFHRFqZ0Z01dEUtlBGYgMdmK+J2B-OOkcPAuFXBmYoxpY7lOM0rEwtuMMqDcluW-rboUWwfC6sZy7j+cCIegyUNwhgSGR3+FXOcgPydFdj7UR1TgekG4FoVIONY+zHWODEFcxgzoEoa2LnHRjFxHPZcRWITFasus8GFMd-VBD+jdxkA-cd11TxTh3gEYtsU6FkEHFzgn4eeuSwAQzIMUo6eFiMQY5rIzOZiWOtT1XBQDsI0oNkVmKPK5FgR8Q0EdVy15+Q8OeAEDpCy-b8iMJA-bCZ+Fwn4TRmBorfFkJaDu1WgReSxt1yewtJ3gmCfoIcOBCyDSJUAciZ+yk6F04hlnBIVhKZ68SaOVEwlD4JRYkVtqQQeGAWBGxQocwr6Z9KPA-7v5BRNnZbKtnWybZcoFwXbA8ia6DheBeyNUqNiMrtc-BuVA8hFnMQdIuRI3bSZ9l0k-YDJwE2ZL2IkjejQEYA8wH6EbqfAVwO+KcMuC7qUhOSgKAFmfEclaSPsX2PSdtk-hKDERLBPCFnzmzsTLRPXKGIImJCPBQQaYewI5N1GDNyWREoSZhIZ5qjS2Io+EfR006IlZg3gXwFYmpAmQFJv9T5tqCtwlh0JlUnUcrlqldNNRZI6rjVMXZ1TnhoA5QXcHJCUgb4LOT2pxwaB9V+K6xE8e2IuF7duJFtXtEBwokNsKpsfKqZF12lLAxJKnCScmE9hpgHg92XZG0mX7t8ai6UnFoIOERGkFxn-TXkzz2mXTJOo0lUTtL+kXSDpn7a6QhFulGZ9IwfNpFSGXD5S9B-QKfAEGxHzjSO0uVRjHkXzO59ujFGvh8i3Ez8iaxoz0rqj0Q99fY-nDoMkk8Arh4E2gCJsqJBFYyJAOM-lEvggBRcGKoE5rmnxLAllDkTMjksSFJ5U04sAnJ7B4Axl3C2ZHM2AFzM57a8OakI5BqzKHrsyMByssKnjEhmaQOgu+Jjqa1BSrgR8hYAbKgjdBDYTewLDCfLO1ncSzKxI05mk0EknSHZuMmvDrPLh2VRRkHIyi0kew7JWWmEfzpOC6jh5jyOoZYnbMqmezOZeMiCuwJOL-hAIxk4JPNUCDYkzMJ8O+HfHNlFFW6McnwM8FrR285ZmshWUrNgDIBBm7A46b0wTmKy8Ztc+uV7IgD6yAY-HLqHYyZzOg8SCtG4MeR44xzoeWoJoMlmbk1y65OEjufxNJGVyF6WsjuR2lnlkSO5Xc+oAGG8CoRcQ0g0AiD2eCmIvhFZOLBYmwRkRiAcpeABUB5KQcNALwSkO0E6AmRWYIPSUPKHeJAgPAt04lJciSCiwH5e8jgpzkD54MAg4ck+KNHBpPA26kBBTJBwTpCzYEtIIsD1TVB2MUIRIIcr4ANDlCUYEsR8JBzzI0tHM8CM+CPhBCrhNQndDwHNigLJZCFscO6K+BYV+QSFlPB4O6FBi9wFakoSXmZH5gjx+pJ05hcbBYjPQeI0eThZDjZiAN-YXMCGHMTPxhwEYBC8WCwslgfVno5UTaFVCGCQSDZXC+RbwoDjYRFQSEmGMPHUXqS7C4ikuJIprg4w5SsiumTwp7jmKIYs7VRcItsXfT38DiuOHJWThVwgabi7hffE8VKKg4mg0OH4ojgaKY4EisavRDSqsRIAES0xdEq0paAAgvimxYkrsXIxNFEiyZLIv4FFjzMgKOmpVnXofNgwbwUMd0DjknS2UkHSGCNEwzDYcM44iGBSF9hiDHq2eOUCzIwnNYF4HSiPoNiwwjZp2d3A3K3U3AzZQ026OfFRidHnpbUro7cZkgBBGiY5hPHUBYsiYsEmUvsJ6esvbSgYe0WywxY1MaSqk-U2gSwHayzAysn5cdIsEyivxXKbCqmLzB0vxAhFH0i-Ipj1TvjtVC8eieUDONlkgiJlaWYkUCshTaorcqzHoPf3cAfkLI6yOkN1HxaR53sOk77PpLahpiIEOEEsgEAhRIRdQUjUxGYCsiDkzI3QbZqVJVzoAkFQQ0aLMS7h+5N0HOD1DVm3o-05wlZUjlGntzVzncSC6JK3Q3C0lDl47IYHYF5hNpUweUw2Qu1kKQdgQvSewHcVnC7Ibqg0VZgClxK5EfANgOog0SaL8pWi7RJxCQuqJITTe3xeiXdyKkhE2EwmE1a0t6ampdiRJIEsgADkgh7ggiZBNir8AmBqUVNdQR+LynLV4mxS1BtKRjIByry2JPcNnhWKewFiq-Snl304Qq1I8j5JctjEg59QXQowQapuDN6DQzy4wFEeh3JADIK5CKw9DRWgpgAA58MdMH-XMDD5dk2hfHoCkvjtcXlC7IUpB2-TShKeFCwBiEGMQrgSyuocRMREWbbMnZ4VSKuxAyrPQ51dNWLGuEplmz3gQRLuLqWDgBFiuoIfas4urUXkUWqJczKAUtF4lmOD8CyNisD4LtwlJMgGHBIHLoYdQLdDoLdUl7w0HavBZ6gGp5qmpFhyvWdUBu3kjtNqvBAdXlPv4Zg5WZ8gqaoU7XjLg6OtUOlgCzX+DdUgfMzDOAVo+dvY6zIkJzFqLlDTUL9c+vPUXo31txT1RjZklZLstMSA2AFibzxBLMF23DZJv9ApX5MoYsmcDSYHLRANwmQ1FtaXP1KB8CIjjCkc6rQ10F8qn6IwGVWoW0Diq0tT4H1NeAbh4C7KoaXsxU7jMkF7qWLHTVSTkhggFraRpAQ2bDklWKrYgGqwIlOb9NUHLCovyqLskTy-CP+gCjNwiytAX0yVaRsTivtcJH7GjkgpXDFhDhlgCYp4EqzSNmYPUrdGYGQEdKmUsWbMAMncrmzsVJNaopkj0pm5ZB5S0LWxxGiGqvgzlDBc8GnB5zPYNIT2qmoCV2EB+8PRHsj04h6rCiojHBaHjlD39Cw+9Sxex1zByTWNaa6iCRKZ4qwkFKi-oFMBeBXd5i7fAyhwT0Q71AmR5WQeX1d7HZZNdBNVdSoVBDCOEVAqBPYGZLG5cw7a2Qcfy4iIiPio89dMMgbHt9OKAQq3LHTKpnifpLA+QWwI7nVq2x0CXORHNDw-DqBsHXTmfAy5w6NJdg5IREKWEAcVh5KlNq1SaW6lywbUzqEfOx20C-0W4KsLIKqEFRah7rCAOGtvjjk7G7gb5uLy6TvFNCRILurfEcncSphh60qHqunFQ5bAY0QwNiPN5UaNwESM4SiQJG6aP4eq6AjAtzVwxt0vW9Qt4DY4KjwGm20bYf1VFCj1RFAREbAlGjq16QYREYLKIGyh56QXSeGh2MtTxik0QKwWVH13Bi7UI5s0MQCHDHijvxSW4GYkMvEUAdloWzoMHroGscWCPgcOV1HUGPp4YbLLfttMSF-jIhgEzpkHrrTp6at4ezqTpyzyvzldERLiaJPBmZbQtZucQR8RhjTj6VTE+GDKHrGx0Aeoi-vrbrikkrEpD2ynfUF7xjAMk6KjwH5zO3XqwiaI1Ap0F1AlT7NIWoxa1XcqeorAgfWJBZFlH-AMu+uUCqCEnlF6RJSvKAP9Nb0qcA5FucYGQK3D5UEZ7fZbiaN4JdwRsHgKeVXIwHcqM+wQjPDLQHz+dpg4BYEPyrKpxZADy8mVd7La277+e2c0MgZRxYQEaZnurhKEDnDbhED2Mx2Uz1Q1oGsQfzM-OEVmA6gggS2n0iEQIw985G8K+2UAdXmvg8YG2VpiQtnCxYaieiTlmx1wNytw8EahATYmIMrzE53s5OcjtC29AlinJe7NJhzArTh5wIUBjPhRlmYhs0h5A9zLblzzZD3O0LVVm9wW5AURDYFBoaKKmIBqlrDPBbxH081p5eMsQB3KxxpAzDFBxCH-qj1fay0ZAqxMyJdD0E9Er81nREDCBAA */
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
                  START_PASSKEY_LOGIN: 'retrievingCredentialRCR',
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
                  onDone: [
                    {
                      target: 'registerMethodSelection',
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
