import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
  Row,
  Column,
} from '@react-email/components';

interface RegistrationPendingEmailProps {
  submittedByName: string;
  eventTitle: string;
  eventType: string;
  eventStartDate: string;
  eventEndDate: string;
  eventVenue: string | null;
  confirmationCode: string;
  registrants: { fullName: string; email: string }[];
  headcount: number;
  paymentIntent: string;
  eventFee: number;
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  CAMP: 'Camp',
  FELLOWSHIP: 'Fellowship',
  SEMINAR: 'Seminar',
  WORSHIP_NIGHT: 'Worship Night',
};

function paymentMessage(intent: string, fee: number): string {
  if (fee === 0 || intent === 'FREE') return 'This event is free — no payment required.';
  if (intent === 'CASH') return `Please bring PHP ${fee.toLocaleString()} cash on the day of the event.`;
  return `Your payment receipt has been received and is currently under review by the organizer.`;
}

export function RegistrationPendingEmail({
  submittedByName,
  eventTitle,
  eventType,
  eventStartDate,
  eventEndDate,
  eventVenue,
  confirmationCode,
  registrants,
  headcount,
  paymentIntent,
  eventFee,
}: RegistrationPendingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Registration received for {eventTitle} — {confirmationCode}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Registration Received</Heading>
          <Text style={text}>Hi {submittedByName},</Text>
          <Text style={text}>
            Your registration for <strong>{eventTitle}</strong> has been received and is now
            pending review. A secretary will verify your details and notify you once approved.
          </Text>

          {/* Confirmation code badge */}
          <Section style={codeBadge}>
            <Text style={codeLabel}>Confirmation Code</Text>
            <Text style={codeValue}>{confirmationCode}</Text>
            <Text style={codeHint}>Save this — you will need it for check-in.</Text>
          </Section>

          {/* Event details */}
          <Section style={card}>
            <Text style={sectionTitle}>Event Details</Text>
            <Row>
              <Column>
                <Text style={detailLabel}>Event</Text>
                <Text style={detailValue}>{eventTitle}</Text>
              </Column>
              <Column>
                <Text style={detailLabel}>Type</Text>
                <Text style={detailValue}>{EVENT_TYPE_LABEL[eventType] ?? eventType}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={detailLabel}>Start Date</Text>
                <Text style={detailValue}>{eventStartDate}</Text>
              </Column>
              <Column>
                <Text style={detailLabel}>End Date</Text>
                <Text style={detailValue}>{eventEndDate}</Text>
              </Column>
            </Row>
            {eventVenue && (
              <Row>
                <Column>
                  <Text style={detailLabel}>Venue</Text>
                  <Text style={detailValue}>{eventVenue}</Text>
                </Column>
              </Row>
            )}
            {eventFee > 0 && (
              <Row>
                <Column>
                  <Text style={detailLabel}>Registration Fee</Text>
                  <Text style={detailValue}>PHP {eventFee.toLocaleString()}</Text>
                </Column>
              </Row>
            )}
          </Section>

          {/* Registrant list */}
          <Section style={card}>
            <Text style={sectionTitle}>
              Registrant{headcount > 1 ? 's' : ''} ({headcount})
            </Text>
            {registrants.map((r, i) => (
              <Row key={i} style={{ marginBottom: '8px' }}>
                <Column style={{ width: '24px' }}>
                  <Text style={detailLabel}>{i + 1}.</Text>
                </Column>
                <Column>
                  <Text style={{ ...detailValue, margin: 0 }}>{r.fullName}</Text>
                  <Text style={{ ...detailLabel, margin: 0 }}>{r.email}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Payment reminder */}
          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Payment:</strong> {paymentMessage(paymentIntent, eventFee)}
            </Text>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You will receive another email once your registration is officially approved.
            If you have questions, contact the event organizer directly.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f9fafb',
  fontFamily: 'Inter, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '40px',
  borderRadius: '8px',
  maxWidth: '560px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 16px',
};

const text = {
  color: '#4a4a4a',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const codeBadge = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const codeLabel = {
  color: '#9a3412',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px',
};

const codeValue = {
  color: '#ea580c',
  fontSize: '28px',
  fontWeight: '800',
  letterSpacing: '0.1em',
  margin: '0 0 8px',
  fontFamily: 'monospace',
};

const codeHint = {
  color: '#9a3412',
  fontSize: '13px',
  margin: 0,
};

const card = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
};

const sectionTitle = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const detailLabel = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0 0 2px',
};

const detailValue = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 12px',
};

const infoBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const infoText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: 0,
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  color: '#9ca3af',
  fontSize: '13px',
  lineHeight: '1.5',
};
