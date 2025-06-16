import React from 'react';

const DueDiligenceStatement = ({
    activity_type,
    border_cross_country,
    hs_heading,
    goods,
    Volume,
    net_weight,
    scientifi_name,
    common_name,
    s_unit,
    q_unit,
    verification_code,
    producer_name,
    producer_country,
    place,
    date,
}) => {
    return (
        <>
            <style>
                {`
        table {
          width: 100%;
          border-collapse: collapse;
        }

        td, th {
          border: 1px solid black;
          padding: 6px;
          vertical-align: top;
        }

        .header {
          text-align: center;
          font-weight: bold;
        }

        .section-title {
          background-color: #f2f2f2;
          font-weight: bold;
          text-align: center;
        }

        .dds-declaration {
          border: 1px solid green;
          background-color: #f9fff9;
          padding: 6px;
        }

        .signature-space {
          height: 60px;
          padding-top: 20px;
        }

        .signature-line {
          border-top: 1px solid black;
          margin-top: 20px;
          display: inline-block;
          width: 100%;
          height: 20px;
        }

        .no-inner-borders td {
          border: none;
        }
      `}
            </style>

            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td colSpan="2" rowSpan="2">
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Flag_of_Uganda.svg"
                                    alt="Uganda Flag"
                                    width="150"
                                />
                            </td>
                            <td colSpan="3" className="header" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '100%',  // occupe toute la hauteur de la cellule
                                }}>
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Coat_of_arms_of_Uganda.svg/250px-Coat_of_arms_of_Uganda.svg.png"
                                        alt="Uganda Coat"
                                        width="50"
                                    />
                                    <p style={{ margin: 0 }}>REPUBLIC OF UGANDA</p>
                                </div>
                            </td>

                            <td colSpan="2" rowSpan="2" style={{ textAlign: 'right', verticalAlign: 'top' }}>
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/d/db/European_Commission_Logo.svg"
                                    alt="EU Commission"
                                    width="200"
                                />
                            </td>
                        </tr>
                        <tr><td colSpan="5"></td></tr>

                        <tr style={{ backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>
                            <td colSpan="3">DUE DILIGENCE STATEMENT</td>
                            <td></td>
                            <td colSpan="3">REFERENCE NUMBER</td>
                        </tr>

                        <tr>
                            <td>ACTIVITY TYPE</td>
                            <td colSpan="2">{activity_type}</td>
                            <td></td>
                            <td>BORDER CROSS COUNTRY</td>
                            <td colSpan="2">{border_cross_country}</td>
                        </tr>

                        <tr>
                            <td>HS HEADING(CODE)</td>
                            <td colSpan="2">{hs_heading}</td>
                            <td></td>
                            <td>GOODS DESCRIPTION</td>
                            <td colSpan="2">{goods}</td>
                        </tr>

                        <tr>
                            <td colSpan="2">COMMENTS(ADDITIONAL INFORMATION)</td>
                            <td>VOLUME</td>
                            <td>{Volume}</td>
                            <td>NET WEIGHT</td>
                            <td colSpan="2">{net_weight}</td>
                        </tr>

                        <tr>
                            <td>SCIENTIFIC NAME</td>
                            <td colSpan="2">{scientifi_name}</td>
                            <td></td>
                            <td>COMMON NAME</td>
                            <td colSpan="2">{common_name}</td>
                        </tr>

                        <tr>
                            <td>SUPPLEMENTARY UNIT</td>
                            <td>{s_unit}</td>
                            <td>QUALIFIER UNIT</td>
                            <td>{q_unit}</td>
                            <td>VERIFICATION CODE</td>
                            <td colSpan="2">{verification_code}</td>
                        </tr>

                        <tr>
                            <td>PRODUCER NAME</td>
                            <td colSpan="3">{producer_name}</td>
                            <td>PRODUCER COUNTRY</td>
                            <td colSpan="2">{producer_country}</td>
                        </tr>

                        <tr style={{ backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>
                            <td colSpan="7">OPERATOR INFO</td>
                        </tr>

                        <tr>
                            <td>EORI</td>
                            <td>HRUG000004679</td>
                            <td></td>
                            <td>PHONE</td>
                            <td>256783130358</td>
                            <td>EMAIL</td>
                            <td><a href="mailto:jwetub@agrivields.com">jwetub@agrivields.com</a></td>
                        </tr>

                        <tr>
                            <td>COUNTRY OF ACTIVITY</td>
                            <td colSpan="2"></td>
                            <td>ADDRESS</td>
                            <td colSpan="3">T2 BUILDING PAPAYE RISE KIWATULE, KAMPALA</td>
                        </tr>

                        <tr>
                            <td colSpan="2" style={{ border: '1px solid green', backgroundColor: '#f9fff9', padding: '6px' }}>
                                <strong>DDS DECLARATION</strong>
                            </td>
                            <td colSpan="5">
                                By submitting this due diligence statement the operator confirms that due diligence in accordance
                                with Regulation (EU) 2023/1115 was carried out and that no or only a negligible risk was found
                                that the relevant products do not comply with Article 3, point (a) or (b), of that Regulation.
                            </td>
                        </tr>

                        <tr>
                            <td colSpan="2" rowSpan="2">Signed for and on behalf of:</td>
                            <td colSpan="2"></td>
                            <td>PLACE</td>
                            <td colSpan="2" style={{ height: '60px', paddingTop: '20px' }}>{place}</td>
                        </tr>
                        <tr style={{ height: '60px' }}></tr>

                        <tr>
                            <td>DATE</td>
                            <td colSpan="3" style={{ height: '60px' }}>{date}</td>
                            <td colSpan="3" style={{ height: '60px' }}></td>
                        </tr>

                        <tr>
                            <td colSpan="3">
                                Name and Function<br />
                                <div style={{ borderTop: '1px solid black', marginTop: '20px', height: '20px' }}></div>
                            </td>
                            <td></td>
                            <td colSpan="2">
                                SIGNATURE<br />
                                <div style={{ borderTop: '1px solid black', marginTop: '20px', height: '20px' }}></div>
                            </td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default DueDiligenceStatement;
