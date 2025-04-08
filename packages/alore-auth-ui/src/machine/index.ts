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
    /** @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBmAIwCAdAHYATHoCcANnUAOUwBYLevQBoQATzUGDmzTuMWB603oWBuohpgC+YU5oWLgEJGA6JPiyAG7kAJLs6fTpAIIAMukAWlSCIkggktKy8ooqCBrW1jrq1vaaBkECVqaaAKxOrg2adhY6pgJtHkZWbeoRURg4+ESkicTJhGlkmdl5hSV8muXiUjJyChX1qpp6pjqavbfGBn161sYvji5qI5M6QXsfQMAhefjsCxA0WWcTWm221Do-GEiiq51qV0Q2jGI0+QWmrT6AlMgzcAk8LWsrWM5NMPjakOhsVWCXh5Bo6QA4uxGABVAAKZVRZxql1A9QMVOM+iammswVMNgC3yGqncHW8NJpfWMJnUr0ZS2Z8R0bLIHO5fMFx2F1QudUQkvU0ve1jlCqV9lJDWmfQegVaHwsWluhpiKxNZvyrE5mSFFTRoodCHcFj9-RMwPspgM5gs3rV2l01gE3V1bxeboMYZhLNNeFS5AAYqwKJzWEx+bkaDQAOqtgAi8dOdox4sdAj6YzsRJMk0+NmsBc0xj692MthCmnUdwstj6NeNcIbWwSAHcwAAjdTMeSkBsSABOOjwd7AJ+IUDIbHYTfSFGwRheyoAAhdRGGjWN2GHSoRXtTEEEeOwHgMHwvlzHd5W9dw1x0PprGBKwp1GatIihI0I2PRsdAva9b2Ie90CfHQwAAW2QQgABt0mIMQMDIAA1KgKHSJsAE1GCobBcnSfJJMKWMQNk7IxJgxN4PHRDTCCFC0KMDD3gMbCQTGfDCNMYjAlIxZw1hVkTzSGirxvN8H2fNJH0IAAzZwSCgKh2K4qhOMIKBCEvLiZGcMgIHkBISBSCQAGtWQouz62o2iXIY98mPcsBPJ8vyAo4zjgtC8LIvQZwEASiQ8GQUUyjUuCx2ULETGldRyTuewDKwn4U38PQdEmczLKCQ9KPszLnPoxjmI87zfM-EqgpCsKIpC6qyAKx9mLETjGq8p9WNNNK6zZJy6NcvKdCWorVsCsqNsq7aarqhqmuEFrRzFdrEM6loeuVfqjMGyVczwgjOgsiwSKm9Krqy+bcuYtjSoMLzkFvCByCEkTxJYfIZMA38mCkmS5IMJtcl+9F-vqW5-kVTx5UMcxDOw2x7jG2GJus8jbMuhzzzm27FoK5a-OYI7CFY9gvPQNbOKx5AYri9ZEpS87hcjUXruyhb8sKlaoFljiFaVlW1dq4hEq+i5mpRBNWsZrELEecYCL6W4Ocw8GhleWxofG+GrMRkXZpunK3PuqXHvNuWreV561d2x99ufQ7jtO3Xa316OjbRk3pc-C35cV1PMexu2Hcap2fpdkcGeTEYvZsPpfb6zmBqDiYxj5ojw8msimWmjLT0N1G48ICBOPZKh8ioZgmB-dgV-oVt6aTBC5Q1N0LBedRfd8SxsO6rxUKnARc3lGx5jHi7C6nziJDC4hzQYAVGGoWMaC4BQPkdAKA7w0gDEsbQ8Kggss8E+HQSSDXlH6EE7g8SeEnBZA8T89ZUVfu-EgiR57kEgpkIC2QAASQFQI3g4BvVe29m6wT+m3KkXh3g6k8D4d4Ix8yDW3HoXQq5FxH2QSEawkcX6OTfh-IhC8yDthjMvCCMY4xMPUm1eo7N0xumsL0Nc7hAjel1AYHQwRjCeD6PqPQ-hWiSLwdIghxA5HkFyAOASuR2DMCoIwLejAuw9n7BQIc6i3bJiaK8cYeh27Bl1IEPhQxtLqBaCET4q55QEVDDgguDiEgyMIXPeRFoeRkN7JQ-x3YaAAGkqCqVCSwhCRhok6FsCWPQXcPCKgSR7Cy4xfBplBLfSYe57EzXwR-c09BcgUE7JUmpElSHQXqa3BCzpIntPMKhAIwY7BLn4XcP0QJ8KeHMBYiwozJ6ONkYUxey9V4VMCYORg2AGAUNYCEk4zCVmaVQhufQxgtzaSpHYW43o5TdTwgMyxETgzhGyUeMZVyCnEK-nc2ZjzgnPNee8o4nyNHuwQPqRULSj7TGCLDNoYKzIAmCIEAI2kTC5guVdfJzibk6Dfg1Ti-JkCwFgClZwNBQqfz-FkGgVCAnVNqSoqCYDNGIEsP4b25hSzdSsHubCbxTGdHxESGk0S9DMoNqylxHL6rIG5by-lYBBXCrICBXIzAqlyoJa0Iw4x-AEQsuYbQALuatBpV3E+0Sj5HyNdRE17LOUWp5XygVQqoCf0lfMxg7AOyMBoAKfkrYuAfNtN8gGrRtAAgsXST4pYLHtOwoEXQcMeFAqaJMcN4zkULx0NIRNvYZCYFjda6Kor0jioeVKhZqill4rCasqx9xIae3JM6N4TRsLdGaP4HMOpLAlmwTZHJiK8lONNR24gXasC9oFfax1zrlm7x+XuUxcpfA2KpIYc+EMV0PBsLqDoupzASPhRPFlB72VHpPT2q157k3SrTUwTN-Js0zKoHm12DSfnAmSRYl4bxiKvAGBDSUV9BH0l4cSSczakVsuIfnGgeBHxgDAJ-JELAOADj2BwAofJ0jDvmS65M3U-kdFQt1Kkt9OgqkdJ+lo0SImdFxGmMj+7rmUehNR2j9GyADqHZB0dsrr3gPqEJv0e4zDkgEO8QyiCg5uhGlSQ+3RDC4kFuPJGxqgNKaWCpujSa5lQfTbB+DuaeONOEQ8H9uICK6mDNW3w4wpwBDMMI0z8mzWKbbXtJ86ndiae89ptRE6UOFq0KYzBDKTDw3JNhbQfpLAbm7v4bocokuRso2lx8ZAtOpt81mnNiHAuoeCN4Fcrx2nwxwxfKkLR8KoT8GuHwwRGsHtZdgMAWAJAQBoGABeJ55Cos3sOoJSGW43oge0ornsCLzgrRZrEipTFdzZtpeGipnTzdkYt5bmBVvrc26KC9TrevHagXmGx6o0wvCpVY-QUm3VWQ3Ia-9zmI0Hto+gTyYAUh+RoBa9AGs1h1R1k5qOLbnHI9R+jz8mPOLoDrua76Qh-taPaYZ4EujPa-LBZOLwn6YWCeDi9whJPCBo4x1jjOWcdA53QCdR8Z0CdSIU-z5bpPheU+p47eQzs8sFq0f0dMgRbjiMVKWXDQxDDNH6OgqcLxtJ87ZbxDAvazxPggL9q9mujtaJPs0V4I89FBGMN6NMyTWa3Bm7fZBNv1h8XQA7p3LvcX5vd4gJoZg8LRN9sSYMlgxMIFhyky+IRiQcLhTuhFlz5e26jzHx8zu2DYH5MvLgjBFGcmUcUxguWE96aT4qZoOZSxJP6FobpiFCR4TpB0W4R9dR+AjyQSvVrHfV8EsJUSOXx2d-lQgD4hhvZNGBLmDD6gA93FGsCwPQ+QSaAjw9M2+QnE4-ivbZKqVcF7uS4Qm-fk78f1Vw3dXTc3cu8EA1w-BRpUxnRAh8IQhjdEBfBmhb45RtQD9PZH4S8AMXNZFP9Pxv8SAH8tZn985S9ANMCE5b8nFf9ad49kMtdEAu4fBvBugC8-Bghh9Q19BnQdxuojACIqRr9SCv979Ypccn98dn5cl39nEsCoAcDiAKDG46cDBADN86CxgaRM9VUWD2dQDfARgbFb4OFeD4dCdyN45TYBCJkhDH9tYX9d0y8JDTCy5pDyDPo-9iBmp1AlCCU1wKQ8wrEQR-B3QwVmZ9ASN3BupDAUC+CzDsD78WtxcjpJc85ZdxCTUpCZC5D-86ddNN8vVmg8QSxJgRgpwj9Bo1xVCvhSxolb5-BjAI9YBUA8A8A4BYAvJUBOIZDKAqAmxEQqFHVvEexfFWAal19qDE9EIw9dB4YT5fBiQrF8JvQbExgAgPhkEeYPhi8hZbDiDCFYAJAlYzxkBaN04fw-wAIM1ewmMBxShsiCVfBeg8IBE1kQUjFBo9cWk2hJx3gdw6QLI6i9j0ADijjsYyBeQ6BGAKFpkBxexpkfEaY6Ybjkw7g-kj5DBolFxYtvQsMzE7iSxtxJ8Og-j9jDiwB04HU-sESEIbB+gWgcw9xYVijA5EB3h7htw3g0xehuhPYNjki39Uj+DPw1ZcZyBLD8DRDX87C+ToioBBTVswAMi3CACN9bi+oHgMkjNjkbAFi3QWk3VLAPBtxDC0CEcicHDE4ZS8Y8C8cbCiCMCP9+TpTsYhT5TmobRRigCaRi1Oppgt0+4mTdR9Bp1B9YZJhUDNibTEcSCpTzTyA4iJcpcZcxDeSD0pDoznTFS3TN87iWT25txtIXgPAA8dQWlmdmYQyQRt0wz0CIzCFMBDiIBASSTgTQSfEaBWAmx6BoTqBGA4T6cmSfjRorE1i1xZxvQ8zNQAUSxVxu5zkjC5d7Dazq8Gz04CZV9wSLjcheR6AKFeyEAcTRpHg+9-A0wj5vQdw-QJgg0PhBkwRuTEyJSD0Fz6ziTSTL0dyu5zA8IvgJhj4pw9khhLBTI-ALIPgQh6SI9SAzwBwhcmjvwOBTjAIriBJ0hvFLjrjPDkwNwvZQQNxup6tzBjFxt2Z9RLBtwzyZyjTjDy8dAIKoL0cYLEQqB2ABxUKdyj4PyzzBFghsRh9fVTtgwbFECNxEtZyUjkz7ShTLSRDrSqyTSpCnSXDKCKTNI0kvA-dVxnQztfSc93AzFQQbEpwu5PYpwojHCJLYyEj4zCCZKTC5LZS0ysj0KEJYdkk9c7h9R4tUJ2d9QQs0I9Fu4eCI9aNYB6MIAZZ5AvJCBpdXCVZJLrCrLjSTCgqQqwriAIqorRQVZ7LWK9x7gqQtBiINxUwgimgAQVxeg3VgxSMRKkzZEMYuJ04GKmKWKlKAZhtpQjdJwZtpirtEIpQARfALE3RrE3QI86rVZgSVyiZKZZJuzaYdzIC-RTNb5gRBq6UwVfl9Ap9JQa1yR+hRq05gSyTXclTkxTlcriRbBHgVjXgwU+MaSepPBgxPA4cKK5zJTHCbZgSRSrT4rKL7CpDPrkAsqWr6grB-Ty1VUOE9LbrIlehOktQV0AgTLE5AbRcDoLKki7ztjJD7TAbgbHLNJICRoUSBKALXQgjBEQiJgwjTMZNQyeT7zZEkriBQqnpSoJLvqpLfq3qkc4Bkq2auJ5Kn81cFSHKTqEJsxdBHg-ZZtP1GTeqRgYsqQ6R1UzARlqrGa7SpSKEzxcglhYqCCGbsbTSzYda9asB8bxblKVxzzcxggrEdd3BTyU8qS9xYttImlkbTbdb9bOa4qjbbScbtafaLaFL5CqDDt3TdxJM7gQRKimg-yFUXbD4CIehAQXrKyEqqKpCzb9bzLc5pdubRLIzHDc7Q7hbXCNcraAY4CUFNxF0JgSwSihgPgvBgQTN-BfZ9RPYI8vJltYQoAmwnwYABxGp1Y-bDasbA6dA+70AB6h7HwR6x7LaMzXUAxNrPgdxiQbBYYFiQgWkLst19K3he7+7VhB7h6wBR70B1Z87EjC6A7qznFZ757L7r6gaw7MidznRxsrAQ9Cjcwq1BoqSAQlqiQwbSxyQva-JOQJB34F4OiJ6xStjp6pDYH4GwB0jP7Ra3zehpRPAjAdQcJliwU2hOddFOFPAdwmUNbja0G4GoAEHYjM50aC6EzxS6H7T0HGHMHnCK7FKCaIE2TT8-B6t6QrBSGiR9BbgcMFwj56ap6n6dAoAGGmGLDNYfrH6TSVGMGsH+Hw6QbaCDS+lCtla4tm6sRWhklAGLET5F0tUI8dGeHEGNGuatGTCnG1GSAsrXTI7lCQhkloCTEBrX0hgOgPgHjPYqHolu6r9aHp7PHeGJk77LL3GqLEm9H64BHq6tEghrH083b9dHh1riR2DWc74jkFGOHp6Bchdy5aM8ZiBZALUKBmAKADbkHwyTTamydzYGn6NmnOJWmKAV6-GCU9EKRiQQRBEJh3gggwU9whEij7N95bBArFdBdenmB+mmnCAWm2m0bs4MaH7FHumNm6m+nIABm9mhm2nRmvkxiJn2F9QHb2kLFPL9lQDTM7tPh9IjBbzqmlGj0ZYdnBnhmMsxUJVssZUO9V7wkcrRo6tnRzAcx+hl0KROhSxMlLBfZJQ6jhUQWrndn9n2mjq3zUJmhG0DELEyxNAFmcwHgT5dQSwzsQgM60n7DgX6miWwWDmyXfGHmgDAyaVFnp0j5b4wUzBmgIi7HHh7B8r8XE1CXGneX2n2toMM0usEMDtBXlDJhtVGVQRp1IYwVBE26Q06VFQJhnt4mlGpCKAwAwpYB0ACp+RUBLwQo8AqkbVtmeWbmOnpKs7-r7SHWnWXXHw3WPXCAvWfXQWbn7n8V4X7i+pPVmSAU6W8MNQiRcy3mKxHhoHPxQ3CBnXXX3XPXvXnBfWVX-WkHA2-r3rE4i2S2I2y3o2K2q3rmLUfHBGtF3ndJ5QcX2k0W8MdI9QggrE0wOgrEC2oAm3w3I3y3Y2-WLUA2i6aqtbHC53S2o2Y3K242u3sHmpFCcmk81bRoqSTB7Mdxh97b7h1VXRTMAUZ2t2W2d32393OJV2OWG2zYX2F222l3q2D39Gv6PCT3gDH2PU3QnhmX8KIZ5QvBKjWYM9gxHNTmbKQ3HXi353W3d2O3iXP2UnMbAXZLMOw3t3F293l3OIE3J1NJdFcrfZtIiQrFJwLGUxSwxhXgDS8Ttw-AqmUG7WyPsOKOAOqOgPCOWGjm2G13Nag7N2sPm3-28OP3u3wPLBtIAQ1xFQTA6RGUFn962g6RgVQQCGBOunHJaNyPnwblzQ3kLjAFsAaBnl3kCg3zqjxy7sdw5Q3gCxUEUFtOpxgyukksrORObOUU6Amq-5B16AKBcgcgOBJJpJZIdzbBOhvBeg3Qjd8I99lx8JpRghfcaQ5hyLM6-qwvm2XEyA3EPEvEfE-FJV9tyX3VtISMSLsx-dBobhcKQtUP9FtBUJQvFPw3qvFlyEtzqEwJ15N5GEe2PZuh9ACRIGSuzBwdeZjMC8oCpzhvrPqukQf4YuAFhJgFhI0vYlVTtA9Q6QeoYDhh02olBFjldx9Fdvwvqvm9lFFk3yRgXLAhUTmPuo7ubgaRklWkNkOl8J3g3uqvw3WJYBsBVsV3mBowwTHPnPsBXP8g0vPgRp8JgwyHWOVxlwzA-RxGCIuCggkbbWp5KvRvgqWbipnov30OEg6eCp21+b-JnpaP8t6gsNdATAVxMw2quvVQ5RSxT93BJwnQcIYf6eueYqiOTmSPLORuOeGfWbufSpeeaCt8HaUIn0bEQ1VxlxolpQp8t6rNUSyuOX2fnwxqBILU55XDl9CYJJprsfDGEBG7zzn1UIn0XgxffhWYUk2hZwLJmTzPrK2f1eHfnoneQoIBXeyXveVrTFJyyjg1AH8uPy0xL8BMN0IQae1e9vHfnfk+ftGrmK2Ari3y7Ba14Zbhw-cxifuv9dcq0wDLAgzBo+g37eTamfSoWfVfY+9uAaefD30yxnTqLILeuTbAIibazePAP0sFqa2grB5eOeJ-h-a3ZOroB-d+uI1O4XKTzfxhf1AhN+0xE7hh+kzFhpF0LFeE-1XrxCj-cbmflf2HBPae4-B+AtGjlPzFpn9NI66PImkhsS+U1w+XSZma3nCp1Pi2-Z8DRjACNQwAVeGvKwDrwN4fER3OLgl3SAcB5qMmLTo8BMgFc3Qy4K1i0keBvB9KPgSIiXzH7vc0BGArAS7kGLt4Bwy8HcmWmlA0tnQt8Y8n6nb4Ao720BECuWQrQoCXwtGDgQvljyp95uPvKbJJjaDxYfAa4bPDcGv5mIDynVAJi+jkGvhWIh0ZbH5DnaPhXe+-O3gALMEWDZAhbEbjYNFC68xiAYVQp3EfRloPgNAmwANm9SfA3gA+UwRIHMELxnBs7Vwa7x-4H8DYA-RwVEKsGxD3BIA+alOBGh4M1kQvA0suDpJmJx8aSelHYhYE6AB+qAYKo+F9YYDnc1AborQF6LMB+iznLeMMVYq6FxgP6IkAfgVAFCs2pWbLjYGGxyDmaWvawdFWZ52DWeFQgAeMNSFhs3BFwTKhkLT5lE6Bq4A8kEFBTt89O-oTFmHk2R4tyhA-DJoIVcb+1ZhZw1Rkk28ZrDVB1NLjigSMDdRTkug3hOhhY5WIheImNDqPzmF7dzh6jYQlcIBE3DdGfDLJuHQFaJtKSojAcmQ1aAzg1u4gk-N0G2qrgA+4DOQcCNwLxD7BQI24ZkxpwGNVBhEEaBAU9SEQpmBQ-CJ+WBDN9LE5ZMYecy2YHMZh4I+YWyJlh3MHh4HOkBDkHJLVDcT1AsH3gYI4Z74nxdltcO5Eo5NmvI9pgSLlF7cemSojwUAW0hyhvAytDcGCFXDB8GguPMxDhmBxB9DRcg6NJxBaEUAE0IqTLFCx7ApoCBZ3b3nxmST9JOouPYFLoKsYAhMI8WWcBkj74VcAB1o20faLazQsNWfmbrDqzhGaQPRoDOwGkmZZZ4CwfVdpFZmnxUg5iVo81DaLaZRiVB6nUEJ6LsxpividgPzjpDDwLhVwpmEMQWK5TDMoxGmJ0SOkYAbkty39LdIiyD4XUjOXcPzgRAMGShuEMCQyG-3K5zkB+1otsXaiOrcD0gvAtCmWIBQpjvR6Ymse3ynAtA0xgopsU6BbEksox6rTrHBnjHf1yxW4qsb6ILAp4sh6xRsdONDFziABBxc4J+AXrgsAE0ydFF2O+7ujTOZiWOlT1XDQDsI0oRkamKPK5F-hf-Uvu9015+RlO+HQZiPyQmsCquqEz8OhNU78iwBrVLIS0DdqtBC8eoAsI9haTvBME-QPTsCDkF4SoABE6joc3iIydCRKErnmxIk6ajN8fgxFiRW2pBB4YBYYbJChzAvon0o8d-m-gH728lsK2NbBtlygXAds9yJroOH4G7JVSI2Iyu1wCG5UDy4WcxB0lZHWdlJH2VSd9g0n-iZkXGaVK6NATe8nsfoJup8BXDb4pwy4bupSE5IApfmZ8SyeF2smfY1JW2T+KWOIn1BrWt2LPrNgYlGieuUMQRMSEeCgg0w9gVkQqIubgtOR2EwEe93VGFs+RIHHBt7zpR5FfAViakCZAkm-03m2oS3CWEQkWccJo3UqbOwOYqiuRaonkWVJGZESZ+EtCYF4EJC1TJQHtdjqoD6r8UXxwYk8acIAEsTzaPaXDhhJraXDJ6-UniYz0-DrS+JnbYARVKrqxTYCRRB4Hdh2RtJl+7fGonhBpHCDhEhpWcR-1Wlc8jpm0j9hxLjLEcipA-NaUsGOkEcBJtxK6YCFQgUsmxs07QPcX1LTkAgGImcRyylwqNo8Sg6vPt0Yo193k64i6QgCkwMEOg8MPRD319h+cOgySTwCuHgTaBwmsogEejIkCYy+Ui+CANVwYqATmuafEsMWQOQMyOSxIEnpTViz8dHsHgVGbMJZlszYAHMzngdPNiyksJHUmesPVZlYDFZWvIWtCK-re8OgO+OUN+SyE21h8hYfrKgjdCDZjeALIqbLK1ksSzKUnTiffV-5qyHZWMzmU7LsojTdWEMjyQ9m2RMtMIfnScF1DDzHkdQyxO2R7I1lyyFZEFTgScX-CARtJwSeaoEGxKmYT4d8O+ObKKJt1o5PgZ4DWlt4yz45js5AL004GFS45i9TWV7PbTVy0JXs8GW3DurQEsMViWxh0DpFcc6CwFOcBuGlnMzK5Tc2AC3Pwley-pxzd2TH3VkNyE5TuZuTXLbl+zExrVYMN4FQi4hJwmCScGbxeDAw+8hlcfNgjIjEBZS8ACoDyXA4aBj5rQdoJ0BMisxgekoeUO8U9iew0SiBCsgzSSCix75u89ghzgD54MAgYck+KNDBpPB26EBeTOBwToCzYEtIIsD1TVB2MUIwITuJAkj5JYUYEsR8OB1zKUsHM8CM+DeyNaahW6XfKwNtQIXixY4d0V8Mwr8gkKKeDwd0KDF7jy1JQkvMyPzBHjtSF5hC5hejGeg8Qo8HCiHGzEAb+wuYEMOYqfjDgIxyhYi42IAO17rQKoW0KKDIppncKe4AcbCIqBgkwxh4ai+SXYQ0UlwWIB1HGLKQMVcL74xixRUHEnYqKhFVi96W-lsVxw5KycKuIDWcVyKeFJiiGNoNDjeKI46iphZorGr0Q0qrESAKEqMUKKtKWgAIF4ssWxLrFyMeJXYpuQyLBBuYszAClpoVZt5WgAMG8CsbdBY5C81lOB0hgjQMMQ2bDCOIhgUhfYsOEwPKHJB1LZ8xCFpeHwGyYZhs47O7kU2hhnxLAnVLuKPKKlNY201os9DantHqdMkAIbUdHIJ46hTFETZgoyl9h3ThlbaEDN2nWVDBRpPyFUr6m0AadpsRgSVsfLjpFhGUl+c5TYQ8z0YWl+IEIg+kX7cceqd8dqgXj0TyhJxSytWSsoSAtZ-lEKLVJbkWY9A7+7gD8hZDWR0huoOLCPG9hUlfZ1JbUTeVohwjFkAg4KJCLqEkamIzAVkQcmZG6DrM8pvTCnOgCQUhDRosxRZcxzEFhN9CZEmkE9lhzahZ8duZedXiQXRI26G4WknsuHZDA7AvMRtKmHSmGyZ2MhcDjgsOQ1oLIpmHZDdUGiLN-kuJXIj4BsB1EGiTRPlK0XaJOISF1RGCSb2+IUS7u2UkImwiEyGrGlQbE1LsSJJAlkA4HLoPcEETIIMVfgEwFSkpqaCsh6U5anE3yWoN7S0ZENVeWxJ7gs8KxT2AsVX4U8u+nCZWhHkfJLlsY4HPqC6FGCDVNwpvQaGeXGCThNwl+AZOXIBEmoaK0FMACGvhjpg-65gIfDsi0J48AUl8dro8pnZClwOX6aUBTwoWAMQgxiFcMWV1DiJiIszdZj7NSqRV2IGVZ6NOtpoxY1w5M1cLsiCJdwdSwcAIkV1BD7Ua4wawmXcEnCItUSZmEAkaLxKMcH4FkDFQHxnYhLCZEEgcmhh1Ct0+5-CXrnDXto8Fnqvq+trzRYkqwp1j6gdptR4K9r0pd-DMNK3LJMdOqTAmdmXUwDprAhOqAPgapOynlmkrtAXpzFqLlCTUL9c+gvSXo311OT1b2D5yob4RugmJfrL82N54g5mM7bhl43+ikqk8VPbEubk0FlogGYTIao2pLl6kA+BERxsSIdWEyHa6YaSWVRBClpplEvHym1NeAbg4CLKpXNywk7DMkFbqGLLTVSTkhggprKRhARWbDl5WirYgMqxOk2atNtIU-HYCqLskTy-CP+v8lNxCytAb079mJSlJ-tcO77ajkgpXDFg9O8y-hZ4AqxSNmYLUzdGYBQEtLGUMWbMAMncrmyMVxNaonMBGFyTfFdhAfsUv81vBIcpKfpTYgwXPBpwucz2MKp2FyC4eCPJHpxG1WFERGRIKzKcrv6Fh96Zi1jrmDEn0bk11EIGYr33WEyKe6YKHtDKu7zE9xaYdgnoh3oBMjycg8vkn1cLarlVFKhUEMI4Q0CoE9gZkkblzDkg21gMgAcfxG2EyRhugHDGumGS7jxenFIIZbljplV3xH0vbuwJdZYCK1TY6BDnPDkh4PhtA6DtpzPjpdIdCkhwREKcGLDsOywklXRxIk2IdS5YOqZ1GB4HkTJ3qKxtFoJIrS9uVQgqLUJdYQAQ1qCccnY3cAfNxeXSd4hoSJDd1b4rIliZML3WlRtVE4yHLYDGiGAMRZvUjSPPvj6hOguoXERpo-jaqoCMCrNXDC3Sda1C3gFjlKPAZLb6th-eUZZvNhtMBRsCUaGrXpBhERg4o-rCHnpBdI4ap4osXaOFT-L+ZkfXcMLtQjmz-RC0oMceJi2qj3uC44sf7sJmdBA9DA5jswR8Bhyuomgh9PDGZZb8md73L8dEN-F27E9JqoPanvK2NStOmeF+QroiLMTeJP05LY+umkAgPiMMCcTSu67wwxgZmX0dJLsAiL++3Iqye9gil2TidfPRAD3jGAZIUVHgXznuIvVhFkRLwlErlJt1+bblrVdyh6noURZkWwPRuiShmCkUBqTQBvUrO+k7stpFqENebnGAUCtw+VKkMuGCBCI98PsYbB4CSyez2ZTuTlRn1CHp5pa-ePztMDAKU69VWgX-ePP-3Yymt2+-nlnJDIGVMW4BKme7q4ShA5w24WA0vMdlc9kNSBrEN81PzhFZgOoIINNu9IhF8MPfWRjCoXl-75ZK818HjHWxNMSFs4GLDUT0RssWOmB6VmHhBCN1nK+BjGVrKTleyBRitAeF31uDGznN7ffPqA2nz9Arug2CQ43PgPeyp5rEmQ4TMqxe5zcAKIhkCjhmqGBqZrdPObyH1-UWDCssQF7MxxpAOdRhruMTR3D2BS0FAqxHSJdB0E9EL8qsBEAiBAA */
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
