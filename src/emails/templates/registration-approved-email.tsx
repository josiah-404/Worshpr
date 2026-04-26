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

interface RegistrationApprovedEmailProps {
  registrantName: string;
  eventTitle: string;
  eventType: string;
  eventStartDate: string;
  eventEndDate: string;
  eventVenue: string | null;
  confirmationCode: string;
  paymentIntent: string;
  eventFee: number;
  notes: string | null;
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  CAMP: 'Camp',
  FELLOWSHIP: 'Fellowship',
  SEMINAR: 'Seminar',
  WORSHIP_NIGHT: 'Worship Night',
};

function paymentReminder(intent: string, fee: number): string | null {
  if (fee === 0 || intent === 'FREE') return null;
  if (intent === 'CASH') return `Please prepare PHP ${fee.toLocaleString()} cash for payment on-site.`;
  return `Your online payment is under review. Please keep your receipt for verification.`;
}

export function RegistrationApprovedEmail({
  registrantName,
  eventTitle,
  eventType,
  eventStartDate,
  eventEndDate,
  eventVenue,
  confirmationCode,
  paymentIntent,
  eventFee,
  notes,
}: RegistrationApprovedEmailProps) {
  const payment = paymentReminder(paymentIntent, eventFee);

  return (
    <Html>
      <Head />
      <Preview>You&apos;re officially registered for {eventTitle}!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Status banner */}
          <Section style={banner}>
            <Text style={bannerText}>✓ Registration Approved</Text>
          </Section>

          <Heading style={h1}>You&apos;re Officially Registered!</Heading>
          <Text style={text}>Hi {registrantName},</Text>
          <Text style={text}>
            Great news! Your registration for <strong>{eventTitle}</strong> has been approved
            by the event organizer. We look forward to seeing you there.
          </Text>

          {/* Confirmation code badge */}
          <Section style={codeBadge}>
            <Text style={codeLabel}>Your Check-in Code</Text>
            <Text style={codeValue}>{confirmationCode}</Text>
            <Text style={codeHint}>Present this code at the registration desk on event day.</Text>
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
          </Section>

          {/* Payment reminder */}
          {payment && (
            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Payment Reminder:</strong> {payment}
              </Text>
            </Section>
          )}

          {/* Secretary notes */}
          {notes && (
            <Section style={notesBox}>
              <Text style={notesTitle}>Note from Organizer</Text>
              <Text style={notesText}>{notes}</Text>
            </Section>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            See you at the event! If you have any questions, please contact the event organizer.
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

const banner = {
  backgroundColor: '#dcfce7',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const bannerText = {
  color: '#15803d',
  fontSize: '14px',
  fontWeight: '700',
  margin: 0,
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
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const codeLabel = {
  color: '#15803d',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px',
};

const codeValue = {
  color: '#16a34a',
  fontSize: '28px',
  fontWeight: '800',
  letterSpacing: '0.1em',
  margin: '0 0 8px',
  fontFamily: 'monospace',
};

const codeHint = {
  color: '#15803d',
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

const notesBox = {
  backgroundColor: '#fefce8',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const notesTitle = {
  color: '#92400e',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 6px',
};

const notesText = {
  color: '#78350f',
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
