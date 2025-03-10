"use client";

import { useState } from "react";

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("privacy");

  return (
    <div className="p-8 ml-64 max-w-6xl">
      <h1 className="text-3xl font-bold text-white mb-6">About HashMelody</h1>

      <div className="mb-8">
        <p className="text-zinc-300 mb-4">
          HashMelody is an AI-driven, decentralized music platform that fuses
          original music creation with blockchain-powered financial incentives.
          We’re dedicated to fostering a fair and transparent ecosystem for both
          music creators and fans, introducing a future where creativity and
          market demand intersect.
        </p>
      </div>

      {/* Tab Buttons */}
      <div className="w-full">
        <div className="grid w-full grid-cols-2 mb-8">
          <button
            onClick={() => setActiveTab("privacy")}
            className={`text-lg p-2 rounded-sm ${
              activeTab === "privacy"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
          >
            Privacy Notice
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`text-lg p-2 rounded-sm ${
              activeTab === "terms"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
          >
            Terms of Use
          </button>
        </div>

        {/* PRIVACY NOTICE */}
        {activeTab === "privacy" && (
          <div className="bg-zinc-800/50 p-6 rounded-lg border border-zinc-700">
            <h2 className="text-2xl font-bold text-white mb-4">
              HashMelody Privacy Notice
            </h2>

            <div className="space-y-4 text-zinc-300">
              <p>Last Updated: March 1, 2025</p>

              <h3 className="text-xl font-semibold text-white mt-6">
                Introduction
              </h3>
              <p>
                This Privacy Notice describes the privacy practices of
                HashMelody and its affiliates (“HashMelody,” “our,” “us,” or
                “we”), in connection with the HashMelody platform. It explains
                the types of personal data we collect, how we use it, and the
                rights and choices you have with respect to your information.
              </p>
              <p>
                By using the HashMelody platform, you acknowledge that you have
                read and understood this Privacy Notice. If you do not agree,
                please discontinue use of our services.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                1. Personal Data Controller
              </h3>
              <p>
                HashMelody is the personal data controller, meaning we determine
                the purposes and means of processing your personal data. Any
                reference to “Personal Data” includes any information related to
                an identified or identifiable individual. It does not include
                data that has been aggregated or anonymized beyond the point of
                re-identification.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                2. Types of Personal Data We Collect
              </h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong>Financial Information:</strong> Cryptocurrency wallet
                  addresses or related transaction details for AI-generated
                  music tokens.
                </li>
                <li>
                  <strong>Transaction Information:</strong> Activities on the
                  HashMelody platform, inquiries, and any associated blockchain
                  interactions.
                </li>
                <li>
                  <strong>Usage Data:</strong> IP addresses, browser details,
                  operating system, referral URLs, cookies, and similar
                  identifiers that help us analyze how you use the platform.
                </li>
                <li>
                  <strong>Compliance Data:</strong> Additional information to
                  comply with legal obligations (e.g., anti-money laundering
                  regulations).
                </li>
              </ul>
              <p>
                We may also collect personal data from publicly available
                sources or third parties. Providing this data is typically
                mandatory to use certain features. If you choose not to provide
                required data, your ability to use or access the platform may be
                limited.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                3. Information We Automatically Collect
              </h3>
              <p>
                We automatically collect certain details about your device and
                browsing actions, including IP address, browser type, operating
                system, referral URLs, timestamps, and interactions with our
                Site. We also use cookies and similar technologies to better
                understand how you navigate and engage with HashMelody.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                4. Cookies & Similar Technologies
              </h3>
              <p>
                We use cookies (small text files stored on your device) to
                remember user preferences and analyze platform traffic. Types of
                cookies may include:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong>Strictly Necessary:</strong> Required for core
                  functionality and authentication.
                </li>
                <li>
                  <strong>Functionality:</strong> Store user preferences and
                  enhance user experience.
                </li>
                <li>
                  <strong>Performance/Analytics:</strong> Gather usage stats to
                  help us improve.
                </li>
                <li>
                  <strong>Targeting (if applicable):</strong> Measure the
                  effectiveness of marketing campaigns or referral sources.
                </li>
              </ul>
              <p>
                You may adjust your cookie settings in your browser. Blocking
                certain cookies may affect platform performance or availability
                of specific features.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                5. Method and Basis of Processing Data
              </h3>
              <p>
                We take appropriate security measures to prevent unauthorized
                access, disclosure, or destruction of Personal Data. Data may be
                processed using computers or IT-enabled tools and may be
                accessible to our authorized personnel or trusted third-party
                service providers (e.g., hosting providers, analytics companies)
                for purposes strictly related to operating and improving the
                HashMelody platform. Legal Bases for Processing We may process
                Personal Data if: You have given consent for one or more
                specific purposes; Processing is necessary for performance of a
                contract or pre-contractual obligations; Processing is required
                for compliance with a legal obligation; Processing is necessary
                for the purposes of our legitimate interests or those of a third
                party; Or any other applicable legal basis allowed under
                relevant data protection laws.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                6. How We Use Personal Data
              </h3>
              <p>
                We may share your Personal Data with our service providers and
                vendors to assist us in providing you with the hashmelody
                Platform. We do not share your Personal Data with third parties
                without your consent, except as described in this Privacy Notice
                or as otherwise required or permitted by applicable law. We may
                share your Personal Data within our group, and with affiliates,
                for purposes consistent with this Privacy Notice. We may share
                your Personal Data with third party companies and individuals
                that provide services on our behalf or help us operate the Site
                or our business. These third parties may use your Personal Data
                only as directed or authorised by us and in a manner consistent
                with this Privacy Notice, and are prohibited from using or
                disclosing your information for any other purpose. We may also
                share your Personal Data for compliance purposes. We may sell,
                transfer or otherwise share some or all of our business or
                assets, including your Personal Data, in connection with a
                business transaction (or potential business transaction) such as
                a corporate divestiture, merger, consolidation, acquisition,
                reorganisation or sale of assets, or in the event of bankruptcy
                or dissolution.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                7. How We Share Personal Data
              </h3>
              <p>
                We do not sell your Personal Data to third parties. However, we
                may share your data in the following ways: Service Providers &
                Vendors We may share data with companies that help us operate or
                improve the HashMelody platform (e.g., web hosting, analytics,
                customer support). They are only authorized to use your data
                under our instructions. Affiliates We may share your data within
                the HashMelody group or affiliates for purposes consistent with
                this Privacy Notice. Business Transfers In the event of a
                merger, acquisition, sale of assets, or bankruptcy, your
                Personal Data may be transferred as part of that transaction.
                Legal & Regulatory We may disclose your Personal Data if
                required by law, court order, or to comply with lawful requests
                from regulatory authorities.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                8. Data Retention
              </h3>
              <p>
                We retain your Personal Data only as long as necessary to
                fulfill the purposes for which it was collected, or as required
                by law. This can include: Contractual Requirements: Until your
                contractual relationship with HashMelody ends. Legitimate
                Interests: As long as needed for security or analytics, unless
                you withdraw consent or object. Legal Obligations: If we must
                retain data to comply with anti-money laundering laws, tax
                regulations, or government orders. After the retention period
                expires, or if the data is no longer needed, it will be deleted
                or anonymized in accordance with applicable legal requirements.
                Note: Blockchain transactions are recorded on a public ledger
                and cannot be altered or erased by HashMelody once confirmed.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                9. Privacy Technology Practices
              </h3>
              <p>
                Links to Third-Party Sites The HashMelody platform may contain
                links to external websites or services that we do not operate.
                These links are not endorsements. We are not responsible for the
                privacy practices of third-party sites. We encourage you to
                review their privacy policies independently. Data Security We
                employ administrative, technical, and physical safeguards to
                protect your Personal Data. However, no transmission method over
                the internet is entirely secure, and we cannot guarantee
                absolute security. Any transmission of Personal Data is at your
                own risk. Blockchain Transactions Blockchain networks (e.g.,
                Ethereum) are decentralized and public. Certain data (like
                wallet addresses or transaction amounts) may be recorded on a
                public ledger that cannot be edited or erased by us. Combining
                blockchain records with other data sources may reveal your
                identity or personal data, but this is beyond HashMelody’s
                control.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                10.Overseas Disclosure and Your Privacy Rights
              </h3>
              <p>
                For purposes of relevant data protection legislation, hashmelody
                is the Personal Data controller. hashmelody is a company with
                operations throughout the world. As a result, Personal Data may
                be transferred outside the country in which you reside for the
                purposes identified. Any such transfer of Personal Data shall
                take place under applicable law and will be protected through
                international data transfer agreements where necessary that have
                been recognised by relevant data protection authorities as
                providing an adequate level of protection to the Personal Data
                we process. By using the hashmelody Platform you understand that
                your Personal Data may be processed in the United States and
                outside of the EEA and the UK. Residents of the EEA and the UK
                are granted certain rights over their Personal Data, which
                include: The right to obtain confirmation of the Personal Data
                we process. The right to rectify inaccurate Personal Data that
                we process. The right to request erasure of your Personal Data,
                subject to exceptions provided under the law. The right to
                restrict certain processing of your Personal Data, so long as
                the processing is not necessary for the performance of or in
                relation to a contract or service to which you are a party. The
                right to receive your Personal Data in a structured, commonly
                used and machine readable format The right to object to the
                processing of your Personal Data, including the right to object
                to automated decision-making and profiling. The right to
                withdraw your consent where you have previously given it for the
                processing of your Personal Data You are generally entitled to
                access Personal Data that we hold about you. If you request
                access to your Personal Data, in ordinary circumstances we will
                give you full access to your Personal Data. Depending on the
                nature of the request, we may charge for providing access to
                this information, however such charge will not be excessive.
                However, there may be some legal or administrative reasons to
                deny access. If we refuse your request to access your Personal
                Data, we will provide you with reasons for the refusal where we
                are required by law to give those reasons. Complaints: If you
                feel that we have not respected your privacy or that we have
                conducted ourselves inconsistently with this Privacy Notice,
                please contact Support and advise us as soon as possible. We
                will investigate your queries and privacy complaints within a
                reasonable period of time depending on the complexity of the
                complaint. We will notify you of the outcome of our
                investigation.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                11. Your Rights & Choices
              </h3>
              <p>
                Depending on your location and applicable law, you may have
                certain rights regarding your Personal Data, including: Access:
                Request a copy of the Personal Data we hold about you.
                Rectification: Request correction of inaccurate or incomplete
                Personal Data. Erasure (“Right to be Forgotten”): Ask us to
                delete your Personal Data under certain circumstances.
                Restriction: Request to limit how we process your data. Data
                Portability: Receive your data in a structured, machine-readable
                format in certain cases. Object: Object to certain types of
                processing, including automated decision-making. Withdraw
                Consent: If you previously gave consent to process your data,
                you can withdraw it, though this does not affect the lawfulness
                of any processing carried out before withdrawal. Note: Some of
                these rights are subject to legal or contractual limitations
                (for example, blockchain records cannot be changed or erased
                once confirmed). To exercise your rights or ask questions about
                your Personal Data, please contact us with sufficient details to
                identify you and the request you wish to make. We will respond
                within a reasonable timeframe. If you believe we have not
                complied with your data protection rights or related laws, you
                may lodge a complaint with your local data protection authority.
                {/* <em> privacy@hashmelody.com</em>. */}
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                12. Complaints & Contact
              </h3>
              <p>
                If you have any concerns about your privacy or feel we have not
                complied with applicable laws, please reach out. You also have
                the right to contact your local data protection authority.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">General</h3>
              <p>
                If you would like to exercise any of the rights listed above, or
                if you would like to contact us about any questions you may have
                regarding your Personal Data, please contact Support and provide
                (i) enough information to identify you and (ii) a description of
                what right you want to exercise and the information to which
                your request relates. Any Personal Data we collect from you to
                verify your identity in connection with your request will be
                used solely for the purposes of verification. If you are
                concerned that we have not complied with your legal rights or
                applicable privacy laws, you may contact us or your local data
                protection authority.
              </p>
            </div>
          </div>
        )}

        {/* TERMS OF USE */}
        {activeTab === "terms" && (
          <div className="bg-zinc-800/50 p-6 rounded-lg border border-zinc-700">
            <h2 className="text-2xl font-bold text-white mb-4">
              HashMelody Terms of Use
            </h2>

            <div className="space-y-4 text-zinc-300">
              <p>Last Updated: March 1, 2025</p>

              <h3 className="text-xl font-semibold text-white mt-6">
                1. Risk Warning
              </h3>
              <p>
                The value of Digital Assets can fluctuate significantly and
                there is a material risk of economic loss when buying, selling,
                holding or investing in Digital Assets. You should therefore
                consider whether trading or holding Digital Assets is suitable
                for you taking into account your personal circumstances,
                financial or otherwise. Please ensure that you fully understand
                the risks involved before using the hashmelody Platform and
                hashmelody Services. You acknowledge that we are not your
                broker, intermediary, agent or advisor and we have no fiduciary
                relationship or obligation to you in connection with any
                activities you undertake when using the hashmelody Platform. We
                do not and are not providing any investment or consulting advice
                and no communication or information that we provide to you is
                intended to be, or should be construed as, advice of any kind.
                You are responsible for determining whether any investment,
                investment strategy or related transaction is appropriate for
                you in light of your personal investment objectives, financial
                circumstances and risk tolerance and you are responsible for any
                associated loss or liability. We do not recommend that any
                Digital Asset should be bought, earned, sold or held by you.
                Before making the decision to buy, sell or hold any Digital
                Asset, you should conduct your own due diligence and consult
                your financial advisor. We are not responsible for the decisions
                you make to buy, earn, sell or hold Digital Assets based on the
                information or services provided by us, including any losses you
                incur arising from those decisions.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                2. Introduction
              </h3>
              <p>
                These Terms of Use (“Terms”) are a legally binding agreement
                between you and HashMelody. By accessing or using the HashMelody
                platform, you agree to these Terms. If you do not agree, do not
                use our services.
              </p>
              <ul>
                <li>
                  1.1. HashMelody is a platform designed to assist with the
                  creation and trading of Digital Assets. The HashMelody group
                  provides users with a platform to create Digital Assets.
                </li>
                <li>
                  1.2. By using the HashMelody Platform you are entering into a
                  legally binding agreement with us. These Terms will govern
                  your use of the HashMelody Platform.
                </li>
                <li>
                  1.3. You must read these Terms, together with the documents
                  referenced in the Terms, carefully and let us know if you do
                  not understand anything.
                </li>
                <li>
                  1.4. You acknowledge that you will be bound by, and agree that
                  you will comply with, any relevant additional terms and
                  conditions that apply to your use of the HashMelody Platform.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6">
                3. Eligibility
              </h3>
              <p>
                2.1. To be eligible to use the HashMelody Platform, you must: a.
                be an individual, corporation, legal person, entity or other
                organisation with the full power, authority and capacity to (i)
                access and use the HashMelody Platform; and (ii) enter into and
                comply with your obligations under these Terms; b. if you act as
                an employee or agent of a legal entity, and enter into these
                Terms on their behalf, you must be duly authorised to act on
                behalf of and bind such legal entity for the purposes of
                entering into these Terms; c. not be located, incorporated,
                otherwise established in, or resident of, or have business
                operations in: i. a jurisdiction where it would be illegal under
                Applicable Law for you access or use the HashMelody Platform, or
                cause us or any third party to contravene any Applicable Law; or
                ii. a country listed in our List of Prohibited Countries. 2.2.
                We may amend our eligibility criteria at any time at our sole
                discretion. Where possible, we will give you notice in advance
                of the change. However, we may occasionally need to make changes
                without telling you in advance. This may include where: a. we
                are making the change as a result of legal and/or regulatory
                changes; b. the changes being made are in your interest; and/or
                c. there is any other valid reason which means there is no time
                to give you notice. Where we are unable to give you advance
                notice, we will let you know of the change as soon as possible
                after it is made.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                4. HashMelody Platform
              </h3>
              <p>
                We may modify, suspend, or restrict access to the HashMelody
                platform at any time. You must not post abusive, defamatory, or
                infringing content; doing so may lead to account suspension.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">5. Fees</h3>
              <p>
                Any fees related to minting tokens or using specific features
                will be disclosed. By using HashMelody, you agree to pay all
                applicable fees. We may update fees from time to time.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                6. Access & Usage
              </h3>
              <p>
                You must have the necessary equipment (computer, internet
                connection) to use HashMelody. Transactions on the blockchain
                are irreversible. We have no obligation to reverse or modify any
                transaction.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                7. Intellectual Property
              </h3>
              <p>
                All rights, title, and interest in the HashMelody platform
                belong to HashMelody or its licensors. AI-generated content and
                tokens you create remain subject to these Terms. By uploading
                content, you grant us a license to display and distribute it in
                connection with the service.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                8. Blockchain Transactions & Risks
              </h3>
              <p>
                The token value may fluctuate based on market demand and social
                metrics. We do not offer refunds, and you must comply with local
                laws when trading or possessing tokens.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                9. Security
              </h3>
              <p>
                We implement security measures to protect user data. However,
                you are responsible for securing your wallet and private keys.
                We are not liable for losses stemming from unauthorized access
                due to your actions or negligence.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                10. Privacy
              </h3>
              <p>
                Please see our Privacy Notice for details on how we collect,
                store, and process personal data.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                11. Termination & Suspension
              </h3>
              <p>
                We may suspend or terminate your access immediately if we
                believe you have violated these Terms or the law. You may also
                stop using HashMelody at any time.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                12. Disclaimer of Warranties & Limitation of Liability
              </h3>
              <p>
                HashMelody is provided “as is.” We disclaim all warranties,
                express or implied. Our maximum liability will not exceed the
                total fees you paid us in the previous three months.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                13. Amendments to Terms
              </h3>
              <p>
                We may modify these Terms at any time by posting the updated
                version. Continuing to use the platform signifies your
                acceptance of the revised Terms.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                14. Dispute Resolution & Governing Law
              </h3>
              <p>
                These Terms are governed by the laws of [Insert Jurisdiction].
                Disputes shall be resolved through binding arbitration or other
                mutually agreed-upon dispute resolution mechanisms, unless
                otherwise required by law.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                15. General Provisions
              </h3>
              <p>
                These Terms constitute the entire agreement between you and
                HashMelody concerning the platform. If any provision is held
                invalid, the remainder will remain in effect. We are not liable
                for delays due to events beyond our control.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">
                Contact Us
              </h3>
              <p>
                If you have questions about these Terms of Use, please contact
                us at:{" "}
                <a
                  href="mailto:terms@hashmelody.com"
                  className="underline hover:text-white"
                >
                  terms@hashmelody.com
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
